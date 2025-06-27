document.addEventListener("DOMContentLoaded", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0].id;
  
      chrome.runtime.sendMessage({ action: "getData", tabId }, (data) => {
        // Block count
        document.getElementById("block-count").textContent = data.blockCount || "0";
  
        // Blocked all-time (learned trackers)
        const trackerList = document.getElementById("tracker-list");
        trackerList.innerHTML = "";
        if (data.learnedTrackers.length === 0) {
          trackerList.innerHTML = "<li><em>None</em></li>";
        } else {
          data.learnedTrackers.forEach((domain) => {
            const li = document.createElement("li");
            li.textContent = domain;
            trackerList.appendChild(li);
          });
        }
  
        // Whitelist
        const whitelistList = document.getElementById("whitelist-list");
        whitelistList.innerHTML = "";
        if (data.whitelist.length === 0) {
          whitelistList.innerHTML = "<li><em>None</em></li>";
        } else {
          data.whitelist.forEach((domain) => {
            const li = document.createElement("li");
            li.textContent = domain;
  
            const removeBtn = document.createElement("button");
            removeBtn.textContent = "Remove";
            removeBtn.onclick = () => {
              chrome.runtime.sendMessage({ action: "removeWhitelist", domain }, (resp) => {
                if (resp.success) window.location.reload();
              });
            };
  
            li.appendChild(removeBtn);
            whitelistList.appendChild(li);
          });
        }
  
        // Blacklist
        const blacklistList = document.getElementById("blacklist-list");
        blacklistList.innerHTML = "";
        if (data.blacklist.length === 0) {
          blacklistList.innerHTML = "<li><em>None</em></li>";
        } else {
          data.blacklist.forEach((domain) => {
            const li = document.createElement("li");
            li.textContent = domain;
  
            const removeBtn = document.createElement("button");
            removeBtn.textContent = "Remove";
            removeBtn.onclick = () => {
              chrome.runtime.sendMessage({ action: "removeBlacklist", domain }, (resp) => {
                if (resp.success) window.location.reload();
              });
            };
  
            li.appendChild(removeBtn);
            blacklistList.appendChild(li);
          });
        }
      });
  
      // Add to whitelist
      document.getElementById("add-whitelist").addEventListener("click", () => {
        const input = document.getElementById("whitelist-input");
        const domain = input.value.trim();
        if (!domain) return;
        chrome.runtime.sendMessage({ action: "addWhitelist", domain }, (resp) => {
          if (resp.success) window.location.reload();
          else alert(resp.error || "Failed to add to whitelist");
        });
      });
  
      // Add to blacklist
      document.getElementById("add-blacklist").addEventListener("click", () => {
        const input = document.getElementById("blacklist-input");
        const domain = input.value.trim();
        if (!domain) return;
        chrome.runtime.sendMessage({ action: "addBlacklist", domain }, (resp) => {
          if (resp.success) window.location.reload();
          else alert(resp.error || "Failed to add to blacklist");
        });
      });
    });
  });
  