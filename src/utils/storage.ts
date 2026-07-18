import {
  clampNoteHeight,
  clampNoteWidth,
  DEFAULT_NOTE_COLOR,
  DEFAULT_NOTE_HEIGHT,
  DEFAULT_NOTE_WIDTH,
  DEFAULT_NOTE_Z_INDEX,
  NOTE_COLORS,
} from '../types/note'
import type { Note, NoteColor } from '../types/note'

const STORAGE_KEY = 'sticky-board-notes'
const STORAGE_VERSION = 4
const LEGACY_STORAGE_VERSION_1 = 1
const LEGACY_STORAGE_VERSION_2 = 2
const LEGACY_STORAGE_VERSION_3 = 3

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

function isValidNoteZIndex(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= DEFAULT_NOTE_Z_INDEX
  )
}

function normalizeNote(
  value: unknown,
  storageVersion: 1 | 2 | 3 | 4,
  noteIndex: number,
): Note | null {
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
    width:
      (storageVersion === LEGACY_STORAGE_VERSION_3 ||
        storageVersion === STORAGE_VERSION) &&
      typeof value.width === 'number' &&
      Number.isFinite(value.width)
        ? clampNoteWidth(value.width)
        : DEFAULT_NOTE_WIDTH,
    height:
      (storageVersion === LEGACY_STORAGE_VERSION_3 ||
        storageVersion === STORAGE_VERSION) &&
      typeof value.height === 'number' &&
      Number.isFinite(value.height)
        ? clampNoteHeight(value.height)
        : DEFAULT_NOTE_HEIGHT,
    color:
      storageVersion !== LEGACY_STORAGE_VERSION_1 && isNoteColor(value.color)
        ? value.color
        : DEFAULT_NOTE_COLOR,
    zIndex:
      storageVersion === STORAGE_VERSION && isValidNoteZIndex(value.zIndex)
        ? value.zIndex
        : noteIndex + DEFAULT_NOTE_Z_INDEX,
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
      (parsedValue.version !== LEGACY_STORAGE_VERSION_1 &&
        parsedValue.version !== LEGACY_STORAGE_VERSION_2 &&
        parsedValue.version !== LEGACY_STORAGE_VERSION_3 &&
        parsedValue.version !== STORAGE_VERSION) ||
      !Array.isArray(parsedValue.notes)
    ) {
      lastSavedValue = null
      return null
    }

    const storageVersion = parsedValue.version
    const seenIds = new Set<string>()
    const seenZIndexes = new Set<number>()
    const validNotes: Note[] = []
    let shouldNormalizeZIndexes = storageVersion !== STORAGE_VERSION

    for (const [noteIndex, value] of parsedValue.notes.entries()) {
      const note = normalizeNote(value, storageVersion, noteIndex)

      if (note === null || seenIds.has(note.id)) {
        continue
      }

      const hasValidStoredZIndex =
        storageVersion === STORAGE_VERSION &&
        isRecord(value) &&
        isValidNoteZIndex(value.zIndex)

      if (!hasValidStoredZIndex || seenZIndexes.has(note.zIndex)) {
        shouldNormalizeZIndexes = true
      }

      seenIds.add(note.id)
      seenZIndexes.add(note.zIndex)
      validNotes.push(note)
    }

    if (parsedValue.notes.length > 0 && validNotes.length === 0) {
      lastSavedValue = null
      return null
    }

    const notesToLoad = shouldNormalizeZIndexes
      ? validNotes.map((note, noteIndex) => ({
          ...note,
          zIndex: noteIndex + DEFAULT_NOTE_Z_INDEX,
        }))
      : validNotes
    const normalizedValue = serializeNotes(notesToLoad)
    lastSavedValue =
      storedValue === normalizedValue ? normalizedValue : storedValue
    return notesToLoad
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
