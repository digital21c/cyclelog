/**
 * Helpers for calendar dates stored as ISO-8601 date-only strings (`YYYY-MM-DD`).
 *
 * A ride happens on a local calendar day, not at an instant in time, so we never
 * convert these strings through `Date` + UTC. Doing so is the classic source of
 * off-by-one-day bugs: `new Date('2026-11-06')` is midnight UTC, which is still
 * 5 November in any time zone west of Greenwich.
 */

/** A calendar date in `YYYY-MM-DD` format. Documents intent; not enforced by the compiler. */
export type IsoDate = string

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

/** True if `value` is `YYYY-MM-DD` and names a real calendar day (rejects 2026-02-30). */
export function isValidIsoDate(value: string): boolean {
  const match = ISO_DATE_PATTERN.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  // Date.UTC rolls invalid days over (Feb 30 -> Mar 2), so a round-trip
  // check tells us whether the day really exists. UTC is used here purely
  // as a calendar calculator; no time zone is involved.
  const candidate = new Date(Date.UTC(year, month - 1, day))
  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  )
}

/** Today's date in the user's local time zone. Pass `now` to make it testable. */
export function todayIsoDate(now: Date = new Date()): IsoDate {
  return toIsoDate(now)
}

/** Formats the local calendar day of `date` as `YYYY-MM-DD`. */
export function toIsoDate(date: Date): IsoDate {
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Compares two valid ISO dates: negative if `a` is earlier, 0 if equal, positive if later.
 * The fixed-width format means plain string comparison gives chronological order.
 * Usable directly as an `Array.prototype.sort` comparator.
 */
export function compareIsoDates(a: IsoDate, b: IsoDate): number {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}
