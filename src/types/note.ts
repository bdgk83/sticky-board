export const NOTE_COLORS = [
  'yellow',
  'pink',
  'blue',
  'green',
  'orange',
] as const

export type NoteColor = (typeof NOTE_COLORS)[number]

export const DEFAULT_NOTE_COLOR: NoteColor = 'yellow'
export const DEFAULT_NOTE_Z_INDEX = 1
export const PINNED_Z_INDEX_OFFSET = 10_000

export const DEFAULT_NOTE_WIDTH = 320
export const DEFAULT_NOTE_HEIGHT = 300
export const MIN_NOTE_WIDTH = 240
export const MIN_NOTE_HEIGHT = 180
export const MAX_NOTE_WIDTH = 700
export const MAX_NOTE_HEIGHT = 700

function clampNoteSize(
  value: number,
  minimum: number,
  maximum: number,
  fallback: number,
): number {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return Math.min(Math.max(value, minimum), maximum)
}

export function clampNoteWidth(width: number): number {
  return clampNoteSize(
    width,
    MIN_NOTE_WIDTH,
    MAX_NOTE_WIDTH,
    DEFAULT_NOTE_WIDTH,
  )
}

export function clampNoteHeight(height: number): number {
  return clampNoteSize(
    height,
    MIN_NOTE_HEIGHT,
    MAX_NOTE_HEIGHT,
    DEFAULT_NOTE_HEIGHT,
  )
}

export interface Note {
  id: string
  title: string
  content: string
  x: number
  y: number
  width: number
  height: number
  color: NoteColor
  zIndex: number
  pinned: boolean
}
