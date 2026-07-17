import type { Note } from '../types/note'
import { StickyNote } from './StickyNote'

interface BoardProps {
  notes: readonly Note[]
  onDeleteNote: (noteId: string) => void
}

export function Board({ notes, onDeleteNote }: BoardProps) {
  return (
    <main className="board" aria-label="포스트잇 게시판">
      {notes.length === 0 ? (
        <p className="board__empty">
          새 메모 버튼을 눌러 첫 메모를 만들어 보세요.
        </p>
      ) : (
        notes.map((note) => (
          <StickyNote key={note.id} note={note} onDelete={onDeleteNote} />
        ))
      )}
    </main>
  )
}
