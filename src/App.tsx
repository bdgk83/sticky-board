import { useState } from 'react'
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
  }
}

function App() {
  const [notes, setNotes] = useState<Note[]>(() => [
    createNote('오늘 할 일', 'Sticky Board 첫 화면 확인'),
  ])

  function handleAddNote() {
    setNotes((currentNotes) => [
      ...currentNotes,
      createNote('새 메모', '내용을 입력하세요'),
    ])
  }

  function handleDeleteNote(noteId: string) {
    setNotes((currentNotes) =>
      currentNotes.filter((note) => note.id !== noteId),
    )
  }

  return (
    <div className="app-shell">
      <Toolbar onAddNote={handleAddNote} />
      <Board notes={notes} onDeleteNote={handleDeleteNote} />
    </div>
  )
}

export default App
