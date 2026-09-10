export const stats = [
  ['BEST_CHROMA', 'Best Chroma'], ['MOST_PURIFIED', 'Most purified in one run'],
  ['MOST_LOOPS', 'Most loops in one run'], ['FURTHEST_DISTRICT', 'Furthest district'],
  ['WORLD_SAVED', 'World restored']
];
// Assessed when a run ends in defeat or victory; abandoning a run does not qualify.
export const achievements = [
  ['FIRST_LOOP', 'Color Outside the Grave', 'Finish a run with at least one closed rainbow loop.', 'MOST_LOOPS', 1, 'trail'],
  ['LOOP_ARTIST', 'Loop Artist', 'Close ten rainbow loops in a single completed run.', 'MOST_LOOPS', 10, 'ricochet'],
  ['FIRST_PURIFICATION', 'Still Magical', 'Purify a zombie unicorn and finish the run.', 'MOST_PURIFIED', 1, 'blast'],
  ['HERD_CONTROL', 'Herd Control', 'Purify fifty zombie unicorns in one completed run.', 'MOST_PURIFIED', 50, 'gun'],
  ['CHROMA_OVERDRIVE', 'Chroma Overdrive', 'Finish a run with at least 5000 Chroma.', 'BEST_CHROMA', 5000, 'recharge'],
  ['DISTRICT_RUNNER', 'The Last of Herd', 'Reach district three and finish the run.', 'FURTHEST_DISTRICT', 3, 'haste'],
  ['LAMP_TOWER', 'Knock on the Dead', 'Reach the final district and finish the run.', 'FURTHEST_DISTRICT', 5, 'shield'],
  ['WISH_GRANTED', 'One Last Wish', 'Rescue Jacob and restore the world.', 'WORLD_SAVED', 1, 'heart']
];
