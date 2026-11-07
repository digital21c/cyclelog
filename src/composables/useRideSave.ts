import { ref, type Ref } from 'vue'

import type { Ride, RideInput } from '@/models/ride'
import type { RideInputErrors, ValidationResult } from '@/models/rideValidation'

export interface RideSave {
  /** Per-field validation errors from the last attempt. */
  fieldErrors: Ref<RideInputErrors>
  /** Message from the last storage failure, or null. */
  saveError: Ref<string | null>
  /** True while a save is in progress. */
  submitting: Ref<boolean>
  /** Pass the form's input here, e.g. from RideForm's `submit` event. */
  submit: (input: RideInput) => Promise<void>
}

/**
 * The save-handling shared by the Add and Edit pages: tracks submitting
 * state, shows validation errors, catches storage failures, and calls
 * `onSaved` on success.
 *
 * Each call creates fresh state, so two pages never share errors or flags.
 */
export function useRideSave(
  save: (input: RideInput) => Promise<ValidationResult<Ride>>,
  { onSaved }: { onSaved: (ride: Ride) => void },
): RideSave {
  const fieldErrors = ref<RideInputErrors>({})
  const saveError = ref<string | null>(null)
  const submitting = ref(false)

  async function submit(input: RideInput): Promise<void> {
    if (submitting.value) return // ignore a second click while saving

    submitting.value = true
    saveError.value = null
    try {
      const result = await save(input)
      if (result.valid) {
        onSaved(result.value)
      } else {
        fieldErrors.value = result.errors
      }
    } catch (error) {
      // Storage failed (e.g. full or unreadable). The form keeps what was typed.
      saveError.value = error instanceof Error ? error.message : String(error)
    } finally {
      submitting.value = false
    }
  }

  return { fieldErrors, saveError, submitting, submit }
}
