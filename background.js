// Static blocklist loaded from blocklist.json
let staticBlocklist = [];

// Global state
let learnedTrackers = [];
let whitelist = [];
let blacklist = [];
let blockCount = 0;
const perTabBlocked = {};
const thirdPartyLog = {};

// Helper function to extract domain
function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

// Initialize extension
async function initialize() {
  // Load blocklist.json first
  try {
    const response = await fetch(chrome.runtime.getURL('blocklist.json'));
    const data = await response.json();
    staticBlocklist = data.trackers;
  } catch (error) {
    console.error('Failed to load blocklist:', error);
    staticBlocklist = [
      "doubleclick.net",
      "google-analytics.com",
      "facebook.net",
      "adservice.google.com",
      "googlesyndication.com",
      "scorecardresearch.com"
    ];
  }

  await loadStoredData();
  await updateBlockingRules();
  setupRequestMonitoring();
}

// Load data from storage
async function loadStoredData() {
  const data = await chrome.storage.local.get({
    learnedTrackers: [],
    userWhitelist: [],
    userBlacklist: [],
    blockCount: 0
  });
  
  learnedTrackers = data.learnedTrackers;
  whitelist = data.userWhitelist;
  blacklist = data.userBlacklist;
  blockCount = data.blockCount || 0;
  
  updateBadge();
}

// Generate rules for declarativeNetRequest
function createRulesFromDomains(domains, startId = 1) {
  return domains.map((domain, index) => ({
    id: startId + index,
    priority: 1,
    action: { type: 'block' },
    condition: {
      urlFilter: `||${domain}^`,
      resourceTypes: ['script', 'xmlhttprequest', 'image', 'stylesheet', 'font']
    }
  }));
}

// Update blocking rules
async function updateBlockingRules() {
  // Combine all domains to block
  const allDomains = [...staticBlocklist, ...learnedTrackers, ...blacklist]
    .filter(domain => !whitelist.includes(domain));
  
  const rules = createRulesFromDomains(allDomains);
  
  // Get existing rule IDs to remove
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeIds = existingRules.map(rule => rule.id);

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: removeIds,
    addRules: rules
  });
}

// Setup request monitoring for learning new trackers
function setupRequestMonitoring() {
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      const requestDomain = getDomain(details.url);
      const initiatorDomain = getDomain(details.initiator || details.documentUrl || '');

      if (!requestDomain || !initiatorDomain || requestDomain === initiatorDomain) {
        return;
      }

      // Track blocked requests for the badge count
      if (isBlocked(requestDomain)) {
        blockCount++;
        chrome.storage.local.set({ blockCount });
        updateBadge();
        
        if (details.tabId !== -1) {
          if (!perTabBlocked[details.tabId]) {
            perTabBlocked[details.tabId] = new Set();
          }
          perTabBlocked[details.tabId].add(requestDomain);
        }
        return;
      }

      // Learning logic
      if (!isAlreadyKnown(requestDomain)) {
        if (!thirdPartyLog[requestDomain]) {
          thirdPartyLog[requestDomain] = new Set();
        }
        thirdPartyLog[requestDomain].add(initiatorDomain);

        if (thirdPartyLog[requestDomain].size >= 3) {
          learnedTrackers.push(requestDomain);
          chrome.storage.local.set({ learnedTrackers });
          updateBlockingRules();
          console.log(`Learned new tracker: ${requestDomain}`);
        }
      }
    },
    { urls: ["<all_urls>"] }
  );
}

function isBlocked(domain) {
  return (staticBlocklist.includes(domain) || 
          learnedTrackers.includes(domain) || 
          blacklist.includes(domain)) && 
         !whitelist.includes(domain);
}

function isAlreadyKnown(domain) {
  return staticBlocklist.includes(domain) || 
         learnedTrackers.includes(domain) || 
         blacklist.includes(domain) || 
         whitelist.includes(domain);
}

// Update badge
function updateBadge() {
  chrome.action.setBadgeText({ text: blockCount.toString() });
  chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
}

// Cleanup tab data when closed
chrome.tabs.onRemoved.addListener((tabId) => {
  delete perTabBlocked[tabId];
});

// Message handling for popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    switch (message.action) {
      case "getData":
        await loadStoredData();
        sendResponse({
          blockCount,
          learnedTrackers,
          whitelist,
          blacklist,
          perTabBlocked: perTabBlocked[message.tabId] ? 
            Array.from(perTabBlocked[message.tabId]) : []
        });
        break;

      case "addWhitelist":
        if (!whitelist.includes(message.domain)) {
          whitelist.push(message.domain);
          await chrome.storage.local.set({ userWhitelist: whitelist });
          await updateBlockingRules();
        }
        sendResponse({ success: true });
        break;

      case "removeWhitelist":
        whitelist = whitelist.filter(d => d !== message.domain);
        await chrome.storage.local.set({ userWhitelist: whitelist });
        await updateBlockingRules();
        sendResponse({ success: true });
        break;

      case "addBlacklist":
        if (!blacklist.includes(message.domain)) {
          blacklist.push(message.domain);
          await chrome.storage.local.set({ userBlacklist: blacklist });
          await updateBlockingRules();
        }
        sendResponse({ success: true });
        break;

      case "removeBlacklist":
        blacklist = blacklist.filter(d => d !== message.domain);
        await chrome.storage.local.set({ userBlacklist: blacklist });
        await updateBlockingRules();
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ success: false, error: "Unknown action" });
    }
  })();
  return true;
});

// Initialize the extension
initialize();