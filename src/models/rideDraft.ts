import type { IsoDate } from '@/utils/isoDate'

import type { RideInput } from './ride'

/**
 * What the ride form holds while someone is typing: every field is a string,
 * because that's what HTML inputs produce. Converting to numbers happens once,
 * explicitly, on submit. Validation stays in `validateRideInput`.
 */
export interface RideDraft {
  date: string
  name: string
  distanceKm: string
  elevationM: string
}

/** A blank form, dated today. */
export function emptyRideDraft(today: IsoDate): RideDraft {
  return { date: today, name: '', distanceKm: '', elevationM: '' }
}

/**
 * Converts form text to a RideInput. Text that isn't a plain decimal number
 * becomes NaN, which validation then reports with a clear message.
 */
export function draftToRideInput(draft: RideDraft): RideInput {
  return {
    date: draft.date.trim(),
    name: draft.name,
    distanceKm: parseDecimal(draft.distanceKm),
    elevationM: parseDecimal(draft.elevationM),
  }
}

// Digits with an optional decimal part: "42", "42.5", "42.", ".5".
const PLAIN_DECIMAL = /^(\d+\.?\d*|\.\d+)$/

/**
 * Stricter than `Number()`, which accepts "", "0x10", "1e3" and "Infinity".
 * Signs are rejected here; negative values are meaningless for rides anyway.
 */
function parseDecimal(text: string): number {
  const trimmed = text.trim()
  return PLAIN_DECIMAL.test(trimmed) ? Number(trimmed) : Number.NaN
}
