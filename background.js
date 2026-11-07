const WORKDAY = /(^|\.)myworkday(jobs|site)?\.com$/;

chrome.action.onClicked.addListener(async tab => {
  const wd = WORKDAY.test(new URL(tab.url).hostname);
  const files = ['content/fill-utils.js', wd ? 'content/workday.js' : 'content/generic.js'];
  try {
    // generic forms are often inside an iframe (e.g. Greenhouse embedded on a company site)
    await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: !wd }, files });
  } catch {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files }).catch(e => console.warn('autofill:', e.message));
  }
});

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') chrome.runtime.openOptionsPage();
});
