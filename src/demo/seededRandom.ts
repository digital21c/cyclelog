/**
 * A tiny seeded pseudo-random number generator (the "Mulberry32" algorithm).
 *
 * `Math.random()` can't be seeded, so it gives different results every run.
 * With a seed, the same sequence comes out every time, which makes demo data
 * stable across reloads and tests deterministic. Not for security purposes.
 *
 * The bit operations below are the published algorithm; treat them as a black box.
 * https://gist.github.com/tommyettinger/46a874533244883189143505d203312c
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0
  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296 // a number in [0, 1)
  }
}
