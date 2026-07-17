interface ToolbarProps {
  onAddNote: () => void
}

export function Toolbar({ onAddNote }: ToolbarProps) {
  return (
    <header className="toolbar">
      <h1 className="toolbar__title">Sticky Board</h1>
      <button className="toolbar__button" type="button" onClick={onAddNote}>
        새 메모
      </button>
    </header>
  )
}
