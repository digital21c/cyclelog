import type { Ride } from '@/models/ride'
import {
  deserializeRides,
  RideStorageError,
  toRideStore,
  type RideStoreV1,
} from '@/repositories/rideStorageFormat'
import { toIsoDate } from '@/utils/isoDate'

/**
 * Backup files: export, reading an import, and planning what an import adds.
 *
 * A backup is the versioned storage document plus two informational fields,
 * so importing reuses the same checks and migrations as loading stored data,
 * and an old backup keeps working as the format evolves.
 *
 * Pure functions: no Vue, no DOM, no storage.
 */

export const BACKUP_APP_NAME = 'CycleLog'

export interface BackupFile extends RideStoreV1 {
  app: typeof BACKUP_APP_NAME
  /** Full ISO-8601 UTC timestamp. Informational only. */
  exportedAt: string
}

/** A backup file can't be imported. The message is written for the user. */
export class BackupFileError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'BackupFileError'
  }
}

// --- Export --------------------------------------------------------------------

/** Builds the backup file's name and (human-readable) JSON contents. */
export function createBackup(
  rides: readonly Ride[],
  now: Date = new Date(),
): { fileName: string; contents: string } {
  const { version, rides: storedRides } = toRideStore(rides)
  // Listed explicitly so the identifying fields come first in the file,
  // before the (long) ride list, for anyone opening it in a text editor.
  const backup: BackupFile = {
    app: BACKUP_APP_NAME,
    version,
    exportedAt: now.toISOString(),
    rides: storedRides,
  }
  return {
    // Local date, so a backup made late in the evening is named for that day.
    fileName: `cyclelog-backup-${toIsoDate(now)}.json`,
    contents: JSON.stringify(backup, null, 2),
  }
}

// --- Import --------------------------------------------------------------------

/**
 * Reads a backup file's text into rides, or throws BackupFileError explaining
 * why it can't be used. Nothing is saved here.
 */
export function readBackup(text: string): Ride[] {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (cause) {
    throw new BackupFileError("This file isn't a CycleLog backup: it isn't valid JSON.", {
      cause,
    })
  }

  if (!isRecord(data) || data.app !== BACKUP_APP_NAME) {
    throw new BackupFileError("This file isn't a CycleLog backup.")
  }

  let rides: Ride[]
  try {
    rides = deserializeRides(text) // version checks, migrations, ride shape checks
  } catch (error) {
    if (error instanceof RideStorageError) {
      throw new BackupFileError(`This backup can't be used. ${error.message}`, { cause: error })
    }
    throw error
  }

  const ids = new Set(rides.map((ride) => ride.id))
  if (ids.size !== rides.length) {
    throw new BackupFileError("This backup can't be used. It contains the same ride twice.")
  }
  return rides
}

export interface ImportPlan {
  /** Rides in the backup that aren't in CycleLog yet. Only these are imported. */
  newRides: Ride[]
  /** Rides in the backup that CycleLog already has (matched by id). Left untouched. */
  alreadyPresentCount: number
}

/**
 * Decides what importing would do: add only rides whose id isn't already
 * present. Existing rides are never overwritten or deleted.
 */
export function planImport(existing: readonly Ride[], incoming: readonly Ride[]): ImportPlan {
  const existingIds = new Set(existing.map((ride) => ride.id))
  const newRides = incoming.filter((ride) => !existingIds.has(ride.id))
  return { newRides, alreadyPresentCount: incoming.length - newRides.length }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
