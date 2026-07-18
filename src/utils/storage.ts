import {
  DEFAULT_NOTE_COLOR,
  NOTE_COLORS,
} from '../types/note'
import type { Note, NoteColor } from '../types/note'

const STORAGE_KEY = 'sticky-board-notes'
const STORAGE_VERSION = 2
const LEGACY_STORAGE_VERSION = 1

interface StoredNotes {
  version: typeof STORAGE_VERSION
  notes: readonly Note[]
}

let lastSavedValue: string | null = null

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNoteColor(value: unknown): value is NoteColor {
  return (
    typeof value === 'string' &&
    NOTE_COLORS.some((noteColor) => noteColor === value)
  )
}

function normalizeNote(value: unknown, storageVersion: 1 | 2): Note | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    value.id.length === 0 ||
    typeof value.title !== 'string' ||
    typeof value.content !== 'string' ||
    typeof value.x !== 'number' ||
    !Number.isFinite(value.x) ||
    typeof value.y !== 'number' ||
    !Number.isFinite(value.y)
  ) {
    return null
  }

  return {
    id: value.id,
    title: value.title,
    content: value.content,
    x: value.x,
    y: value.y,
    color:
      storageVersion === STORAGE_VERSION && isNoteColor(value.color)
        ? value.color
        : DEFAULT_NOTE_COLOR,
  }
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
      (parsedValue.version !== LEGACY_STORAGE_VERSION &&
        parsedValue.version !== STORAGE_VERSION) ||
      !Array.isArray(parsedValue.notes)
    ) {
      lastSavedValue = null
      return null
    }

    const storageVersion = parsedValue.version
    const seenIds = new Set<string>()
    const validNotes: Note[] = []

    for (const value of parsedValue.notes) {
      const note = normalizeNote(value, storageVersion)

      if (note === null || seenIds.has(note.id)) {
        continue
      }

      seenIds.add(note.id)
      validNotes.push(note)
    }

    if (parsedValue.notes.length > 0 && validNotes.length === 0) {
      lastSavedValue = null
      return null
    }

    const normalizedValue = serializeNotes(validNotes)
    lastSavedValue =
      storedValue === normalizedValue ? normalizedValue : storedValue
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
