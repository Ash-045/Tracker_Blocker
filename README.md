🛡️ TrackerBlocker – Chrome Privacy Extension

**TrackerBlocker** is a lightweight, privacy-focused Chrome extension that automatically blocks known tracking scripts and helps you manage privacy with smart, user-controlled rules.

> ✨ Built using Manifest V3 and Chrome’s modern `declarativeNetRequest` API.

---

 🚀 Features

- ✅ **Static blocklist**: Blocks known trackers (like `google-analytics.com`, `doubleclick.net`)
- 🧠 **Auto-learning**: Detects and learns new third-party trackers across sites
- ⚙️ **Whitelist/Blacklist controls**: Let users allow/block specific domains
- 📊 **Real-time badge counter**: Displays number of trackers blocked
- 🧰 **No runtime errors**: Fully Manifest V3-compliant, no `webRequest` crashes

---

🖥️ Installation

Load as Unpacked (Developer Mode)

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer Mode** (top-right)
3. Click **“Load unpacked”**
4. Select the folder where you placed the extension (e.g., `TrackerBlocker/`)


🧠 How It Works

1. Loads a list of known tracking domains
2. Uses Chrome's `declarativeNetRequest` API to block requests to those domains
3. Monitors new third-party domains across multiple tabs
4. Automatically **learns** a domain as a tracker if seen across 3+ different initiator domains
5. Provides **user control** via:
   - Add to whitelist (never block)
   - Add to blacklist (always block)
