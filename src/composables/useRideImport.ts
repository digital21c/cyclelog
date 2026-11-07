import { ref, type Ref } from 'vue'

import type { Ride } from '@/models/ride'
import { BackupFileError, planImport, readBackup, type ImportPlan } from '@/services/rideBackup'
import { useRidesStore } from '@/stores/rides'

/**
 * Each step of importing a backup. A discriminated union: `step` says which
 * shape applies, so the page can't show, say, a preview without a plan.
 */
export type ImportState =
  | { step: 'idle' }
  | { step: 'reading'; fileName: string }
  | { step: 'invalid'; fileName: string; message: string }
  | {
      step: 'preview'
      fileName: string
      rides: Ride[]
      plan: ImportPlan
      importing: boolean
      /** From a failed import attempt; the user can try again. */
      error: string | null
    }
  | { step: 'done'; importedCount: number }

/**
 * The import flow: choose a file → check it and preview → confirm → done.
 * Nothing is saved until `confirmImport` is called.
 */
export function useRideImport(): {
  state: Ref<ImportState>
  chooseFile: (file: File) => Promise<void>
  confirmImport: () => Promise<void>
} {
  const ridesStore = useRidesStore()
  const state = ref<ImportState>({ step: 'idle' })

  async function chooseFile(file: File): Promise<void> {
    state.value = { step: 'reading', fileName: file.name }
    try {
      const rides = readBackup(await file.text())
      state.value = {
        step: 'preview',
        fileName: file.name,
        rides,
        plan: planImport(ridesStore.rides, rides),
        importing: false,
        error: null,
      }
    } catch (error) {
      const message =
        error instanceof BackupFileError ? error.message : "The file couldn't be read."
      state.value = { step: 'invalid', fileName: file.name, message }
    }
  }

  async function confirmImport(): Promise<void> {
    const current = state.value
    if (current.step !== 'preview' || current.importing) return

    state.value = { ...current, importing: true, error: null }
    try {
      const importedCount = await ridesStore.importRides(current.rides)
      state.value = { step: 'done', importedCount }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      state.value = { ...current, importing: false, error: message }
    }
  }

  return { state, chooseFile, confirmImport }
}
