import type { Note } from '../types/note'

interface StickyNoteProps {
  note: Note
  onDelete: (noteId: string) => void
}

export function StickyNote({ note, onDelete }: StickyNoteProps) {
  const titleId = `note-title-${note.id}`

  return (
    <article className="sticky-note" aria-labelledby={titleId}>
      <button
        className="sticky-note__delete"
        type="button"
        aria-label={`${note.title} 메모 삭제`}
        onClick={() => onDelete(note.id)}
      >
        ×
      </button>
      <h2 id={titleId}>{note.title}</h2>
      <p>{note.content}</p>
    </article>
  )
}
