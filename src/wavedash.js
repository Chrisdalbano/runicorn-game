// Host-only adapter. The standard 13 KB archive never loads or requires an SDK.
// API contract: https://docs.wavedash.com/sdk/setup and /sdk/leaderboards
import {createProgress, readRun} from './wavedash-progress.js';
export function attachWavedash(sdk, end, score, summary, label, paused) {
  if (!sdk) return;
  try { if (!sdk.init()) return; } catch { return; }
  const board = Promise.resolve().then(() => sdk.getOrCreateLeaderboard(
    'runicorn-chroma', sdk.LeaderboardSortOrder.DESC,
    sdk.LeaderboardDisplayType.NUMERIC
  )).then(result => result?.success ? result.data.id : null).catch(() => null);
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  end.firstElementChild.append(status);
  const progressStatus = document.createElement('div');
  progressStatus.setAttribute('role', 'status');
  progressStatus.style.cssText = 'font-size:.8em;color:#7fb;line-height:1.6';
  status.after(progressStatus);
  const saveProgress = createProgress(sdk);
  if (paused && typeof sdk.toggleOverlay === 'function') {
    const button = document.createElement('button');
    button.textContent = 'WAVEDASH OVERLAY';
    button.onclick = () => { try { sdk.toggleOverlay(); } catch { button.textContent = 'WAVEDASH UNAVAILABLE'; } };
    paused.firstElementChild.append(button);
  }
  let run = 0;
  new MutationObserver(async () => {
    const current = ++run;
    status.textContent = '';
    progressStatus.textContent = '';
    if (end.hidden) return;
    const value = Number(score.textContent);
    if (!Number.isFinite(value) || value < 0) return;
    const record = summary && label && readRun(score.textContent, summary.textContent, label.textContent);
    if (record) {
      progressStatus.textContent = 'SYNCING ACHIEVEMENTS';
      saveProgress(record).then(ok => {
        if (run === current && !end.hidden) progressStatus.textContent = ok ? 'ACHIEVEMENTS + RECORDS SYNCED' : 'PROGRESS SYNC UNAVAILABLE';
      });
    }
    status.textContent = 'WAVEDASH / SAVING SCORE';
    let boardLabel = 'WAVEDASH OFFLINE / LOCAL SCORE KEPT';
    try {
      const id = await board;
      if (id) {
        const result = await sdk.uploadLeaderboardScore(id, value, true);
        if (result?.success) boardLabel = 'WAVEDASH / BEST RANK ' + result.data.globalRank;
      }
    } catch { /* Keep gameplay and local scores available on platform failure. */ }
    if (run === current && !end.hidden) status.textContent = boardLabel;
  }).observe(end, {attributes:true, attributeFilter:['hidden']});
}
