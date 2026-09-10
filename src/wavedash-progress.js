import {stats, achievements} from './wavedash-catalog.js';

export function readRun(score, summary, label) {
  const match = /^(\d+) PURIFIED\s*[^\d]* (\d+) LOOPS\s*[^\d]* DISTRICT ([1-5])\/5$/i.exec(summary.trim());
  const value = Number(score);
  if (!match || !Number.isSafeInteger(value) || value < 0 || !['SIGNAL LOST','WISH GRANTED'].includes(label)) return null;
  const values = [value, Number(match[1]), Number(match[2]), Number(match[3]), +(label === 'WISH GRANTED')];
  if (!values.every(Number.isSafeInteger)) return null;
  return Object.fromEntries(stats.map(([id], i) => [id, values[i]]));
}

// storeStats() returns a scheduling boolean, NOT a persistence Promise.
// Only STATS_STORED can confirm that the host actually saved the batch.
export function createProgress(sdk, timeout = 10000) {
  let loaded = false, uncertain = false, queue = Promise.resolve();
  async function save(run) {
    if (uncertain) return false;
    let wrote = false;
    try {
      if (!loaded) {
        const result = await sdk.requestStats();
        if (!result?.success) return false;
        loaded = true;
      }
      const values = {};
      for (const [id] of stats) {
        const old = sdk.getStat(id);
        values[id] = Math.max(Number.isFinite(old) ? old : 0, run[id]);
      }
      const missing = achievements.filter(([id,,,stat,threshold]) => values[stat] >= threshold && !sdk.getAchievement(id));
      const changes = stats.filter(([id]) => values[id] !== sdk.getStat(id));
      if (!changes.length && !missing.length) return true;
      const ok = await new Promise(resolve => {
        let done = false, off = () => {};
        const finish = ok => { if (done) return; done = true; clearTimeout(timer); off(); resolve(ok); };
        const timer = setTimeout(() => finish(false), timeout);
        try {
          off = sdk.on(sdk.Events.STATS_STORED, result => finish(result?.success === true));
          for (const [id] of changes) {
            if (!sdk.setStat(id, values[id], false)) throw Error('Stat unavailable');
            wrote = true;
          }
          for (const [id] of missing) {
            if (!sdk.setAchievement(id, false)) throw Error('Achievement unavailable');
            wrote = true;
          }
          if (!sdk.storeStats()) finish(false);
        } catch { finish(false); }
      });
      // The SDK may retain optimistic local values after a failed save. Do not
      // mistake those values for confirmed server progress later in this session.
      if (!ok && wrote) uncertain = true;
      return ok;
    } catch { if (wrote) uncertain = true; return false; }
  }
  return run => {
    const snapshot = {...run};
    queue = queue.then(() => save(snapshot));
    return queue;
  };
}
