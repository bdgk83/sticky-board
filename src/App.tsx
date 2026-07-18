import { useCallback, useEffect, useRef, useState } from 'react'
import { Board } from './components/Board'
import { Toolbar } from './components/Toolbar'
import {
  clampNoteHeight,
  clampNoteWidth,
  DEFAULT_NOTE_COLOR,
  DEFAULT_NOTE_HEIGHT,
  DEFAULT_NOTE_WIDTH,
  DEFAULT_NOTE_Z_INDEX,
} from './types/note'
import type { Note, NoteColor } from './types/note'
import { loadNotes, saveNotes } from './utils/storage'
import './App.css'

let fallbackId = 0
const SAVE_DEBOUNCE_MS = 200

function createNoteId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  fallbackId += 1
  return `note-${Date.now()}-${fallbackId}`
}

function createNote(title: string, content: string, zIndex: number): Note {
  return {
    id: createNoteId(),
    title,
    content,
    x: 0,
    y: 0,
    width: DEFAULT_NOTE_WIDTH,
    height: DEFAULT_NOTE_HEIGHT,
    color: DEFAULT_NOTE_COLOR,
    zIndex,
  }
}

function getHighestNoteZIndex(notes: readonly Note[]): number {
  return notes.reduce(
    (highestZIndex, note) => Math.max(highestZIndex, note.zIndex),
    0,
  )
}

const initialNotes = loadNotes() ?? [
  createNote(
    '오늘 할 일',
    'Sticky Board 첫 화면 확인',
    DEFAULT_NOTE_Z_INDEX,
  ),
]

function App() {
  const [notes, setNotes] = useState<Note[]>(() => initialNotes)
  const latestNotesRef = useRef(notes)

  useEffect(() => {
    latestNotesRef.current = notes
    const saveTimer = globalThis.setTimeout(() => {
      saveNotes(notes)
    }, SAVE_DEBOUNCE_MS)

    return () => globalThis.clearTimeout(saveTimer)
  }, [notes])

  useEffect(() => {
    function flushLatestNotes() {
      saveNotes(latestNotesRef.current)
    }

    globalThis.addEventListener('pagehide', flushLatestNotes)

    return () => {
      globalThis.removeEventListener('pagehide', flushLatestNotes)
      flushLatestNotes()
    }
  }, [])

  const handleAddNote = useCallback(() => {
    setNotes((currentNotes) => {
      const nextZIndex = getHighestNoteZIndex(currentNotes) + 1

      return [
        ...currentNotes,
        createNote('새 메모', '내용을 입력하세요', nextZIndex),
      ]
    })
  }, [])

  const handleDeleteNote = useCallback((noteId: string) => {
    setNotes((currentNotes) =>
      currentNotes.filter((note) => note.id !== noteId),
    )
  }, [])

  const handleUpdateNote = useCallback(
    (noteId: string, title: string, content: string) => {
      setNotes((currentNotes) =>
        currentNotes.map((note) =>
          note.id === noteId ? { ...note, title, content } : note,
        ),
      )
    },
    [],
  )

  const handleMoveNote = useCallback((noteId: string, x: number, y: number) => {
    setNotes((currentNotes) =>
      currentNotes.map((note) =>
        note.id === noteId ? { ...note, x, y } : note,
      ),
    )
  }, [])

  const handleBringNoteToFront = useCallback((noteId: string) => {
    setNotes((currentNotes) => {
      const targetNote = currentNotes.find((note) => note.id === noteId)

      if (targetNote === undefined) {
        return currentNotes
      }

      const highestZIndex = getHighestNoteZIndex(currentNotes)

      if (targetNote.zIndex === highestZIndex) {
        return currentNotes
      }

      return currentNotes.map((note) =>
        note.id === noteId
          ? { ...note, zIndex: highestZIndex + 1 }
          : note,
      )
    })
  }, [])

  const handleResizeNote = useCallback(
    (noteId: string, width: number, height: number) => {
      const nextWidth = clampNoteWidth(width)
      const nextHeight = clampNoteHeight(height)

      setNotes((currentNotes) =>
        currentNotes.map((note) =>
          note.id === noteId &&
          (note.width !== nextWidth || note.height !== nextHeight)
            ? { ...note, width: nextWidth, height: nextHeight }
            : note,
        ),
      )
    },
    [],
  )

  const handleChangeNoteColor = useCallback(
    (noteId: string, color: NoteColor) => {
      setNotes((currentNotes) => {
        const targetNote = currentNotes.find((note) => note.id === noteId)

        if (targetNote === undefined || targetNote.color === color) {
          return currentNotes
        }

        return currentNotes.map((note) =>
          note.id === noteId ? { ...note, color } : note,
        )
      })
    },
    [],
  )

  return (
    <div className="app-shell">
      <Toolbar onAddNote={handleAddNote} />
      <Board
        notes={notes}
        onDeleteNote={handleDeleteNote}
        onUpdateNote={handleUpdateNote}
        onMoveNote={handleMoveNote}
        onResizeNote={handleResizeNote}
        onChangeNoteColor={handleChangeNoteColor}
        onBringNoteToFront={handleBringNoteToFront}
      />
    </div>
  )
}

export default App
