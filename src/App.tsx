import { useCallback, useState } from 'react'
import { Board } from './components/Board'
import { Toolbar } from './components/Toolbar'
import type { Note } from './types/note'
import './App.css'

let fallbackId = 0

function createNoteId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  fallbackId += 1
  return `note-${Date.now()}-${fallbackId}`
}

function createNote(title: string, content: string): Note {
  return {
    id: createNoteId(),
    title,
    content,
    x: 0,
    y: 0,
  }
}

function App() {
  const [notes, setNotes] = useState<Note[]>(() => [
    createNote('오늘 할 일', 'Sticky Board 첫 화면 확인'),
  ])

  const handleAddNote = useCallback(() => {
    setNotes((currentNotes) => [
      ...currentNotes,
      createNote('새 메모', '내용을 입력하세요'),
    ])
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

  return (
    <div className="app-shell">
      <Toolbar onAddNote={handleAddNote} />
      <Board
        notes={notes}
        onDeleteNote={handleDeleteNote}
        onUpdateNote={handleUpdateNote}
        onMoveNote={handleMoveNote}
      />
    </div>
  )
}

export default App
