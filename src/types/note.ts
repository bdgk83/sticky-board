export const NOTE_COLORS = [
  'yellow',
  'pink',
  'blue',
  'green',
  'orange',
] as const

export type NoteColor = (typeof NOTE_COLORS)[number]

export const DEFAULT_NOTE_COLOR: NoteColor = 'yellow'

export interface Note {
  id: string
  title: string
  content: string
  x: number
  y: number
  color: NoteColor
}
