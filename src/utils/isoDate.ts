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

/**
 * Converts a valid ISO date to a `Date` at local midnight on that day, for
 * display formatting. Built from its parts, never via `new Date('YYYY-MM-DD')`,
 * which would be UTC midnight and can show as the previous day.
 */
export function isoDateToLocalDate(value: IsoDate): Date {
  const [year, month, day] = value.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined || !isValidIsoDate(value)) {
    throw new Error(`Not a valid ISO date: ${value}`)
  }
  return new Date(year, month - 1, day)
}

// --- Calendar arithmetic --------------------------------------------------------
// These work purely on calendar dates. Date.UTC is used only as a calendar
// calculator (it knows month lengths and leap years); no time zone is involved,
// so results never shift by a day.

function toCalendarDate(value: IsoDate): Date {
  const [year, month, day] = value.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined || !isValidIsoDate(value)) {
    throw new Error(`Not a valid ISO date: ${value}`)
  }
  return new Date(Date.UTC(year, month - 1, day))
}

function fromCalendarDate(date: Date): IsoDate {
  const year = String(date.getUTCFullYear()).padStart(4, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** The date `days` days later (or earlier, if negative). */
export function addDays(value: IsoDate, days: number): IsoDate {
  const date = toCalendarDate(value)
  date.setUTCDate(date.getUTCDate() + days)
  return fromCalendarDate(date)
}

/**
 * The same day `months` months later (or earlier). If that month is shorter,
 * the day is clamped to its last day: 31 Jan + 1 month → 28 (or 29) Feb.
 */
export function addMonths(value: IsoDate, months: number): IsoDate {
  const date = toCalendarDate(value)
  const day = date.getUTCDate()
  date.setUTCDate(1) // avoid rolling over while changing the month
  date.setUTCMonth(date.getUTCMonth() + months)
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
  date.setUTCDate(Math.min(day, lastDay))
  return fromCalendarDate(date)
}

/** The Monday on or before `value` (ISO 8601 weeks start on Monday). */
export function startOfIsoWeek(value: IsoDate): IsoDate {
  const dayOfWeek = toCalendarDate(value).getUTCDay() // 0 = Sunday … 6 = Saturday
  const daysSinceMonday = (dayOfWeek + 6) % 7
  return addDays(value, -daysSinceMonday)
}

/** The first day of the month containing `value`. */
export function startOfMonth(value: IsoDate): IsoDate {
  toCalendarDate(value) // validates
  return `${value.slice(0, 7)}-01`
}

/** 1 January of the year containing `value`. */
export function startOfYear(value: IsoDate): IsoDate {
  toCalendarDate(value) // validates
  return `${value.slice(0, 4)}-01-01`
}
