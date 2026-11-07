import type { LocationQuery } from 'vue-router'

/**
 * Reads one option from a URL query value, which may be a string, null, or an
 * array (for `?a=1&a=2`, the first is used). Returns it only if it's one of
 * the allowed options, otherwise the fallback: URLs are untrusted input.
 */
export function readQueryOption<T extends string>(
  value: LocationQuery[string] | undefined,
  options: readonly T[],
  fallback: T,
): T {
  const candidate = Array.isArray(value) ? value[0] : value
  return options.find((option) => option === candidate) ?? fallback
}
