import './App.css'

function App() {
  return (
    <div className="app-shell">
      <header className="toolbar">
        <h1 className="toolbar__title">Sticky Board</h1>
        <button className="toolbar__button" type="button">
          새 메모
        </button>
      </header>

      <main className="board" aria-label="포스트잇 게시판">
        <article className="sticky-note" aria-labelledby="default-note-title">
          <h2 id="default-note-title">오늘 할 일</h2>
          <p>Sticky Board 첫 화면 확인</p>
        </article>
      </main>
    </div>
  )
}

export default App
