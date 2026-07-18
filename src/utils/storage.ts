import type { Note } from '../types/note'

const STORAGE_KEY = 'sticky-board-notes'
const STORAGE_VERSION = 1

interface StoredNotes {
  version: typeof STORAGE_VERSION
  notes: readonly Note[]
}

let lastSavedValue: string | null = null

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNote(value: unknown): value is Note {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.title === 'string' &&
    typeof value.content === 'string' &&
    typeof value.x === 'number' &&
    Number.isFinite(value.x) &&
    typeof value.y === 'number' &&
    Number.isFinite(value.y)
  )
}

function serializeNotes(notes: readonly Note[]): string {
  const storedNotes: StoredNotes = {
    version: STORAGE_VERSION,
    notes,
  }

  return JSON.stringify(storedNotes)
}

export function loadNotes(): Note[] | null {
  try {
    const storedValue = globalThis.localStorage.getItem(STORAGE_KEY)

    if (storedValue === null) {
      lastSavedValue = null
      return null
    }

    const parsedValue: unknown = JSON.parse(storedValue)

    if (
      !isRecord(parsedValue) ||
      parsedValue.version !== STORAGE_VERSION ||
      !Array.isArray(parsedValue.notes)
    ) {
      lastSavedValue = null
      return null
    }

    const seenIds = new Set<string>()
    const validNotes = parsedValue.notes.filter((value): value is Note => {
      if (!isNote(value) || seenIds.has(value.id)) {
        return false
      }

      seenIds.add(value.id)
      return true
    })

    if (parsedValue.notes.length > 0 && validNotes.length === 0) {
      lastSavedValue = null
      return null
    }

    lastSavedValue = serializeNotes(validNotes)
    return validNotes
  } catch {
    lastSavedValue = null
    return null
  }
}

export function saveNotes(notes: readonly Note[]): void {
  const serializedNotes = serializeNotes(notes)

  if (serializedNotes === lastSavedValue) {
    return
  }

  try {
    globalThis.localStorage.setItem(STORAGE_KEY, serializedNotes)
    lastSavedValue = serializedNotes
  } catch {
    return
  }
}
