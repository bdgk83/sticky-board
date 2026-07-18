import { useEffect, useRef, useState } from 'react'
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
} from 'react'
import {
  MAX_NOTE_HEIGHT,
  MAX_NOTE_WIDTH,
  MIN_NOTE_HEIGHT,
  MIN_NOTE_WIDTH,
  NOTE_COLORS,
} from '../types/note'
import type { Note, NoteColor } from '../types/note'

const DRAG_THRESHOLD = 4
const INTERACTIVE_SELECTOR =
  'button, input, textarea, select, a, [role="button"], [contenteditable="true"]'
const COLOR_LABELS: Record<NoteColor, string> = {
  yellow: '노란색',
  pink: '분홍색',
  blue: '파란색',
  green: '초록색',
  orange: '주황색',
}

interface StickyNoteProps {
  note: Note
  onDelete: (noteId: string) => void
  onUpdate: (noteId: string, title: string, content: string) => void
  onMove: (noteId: string, x: number, y: number) => void
  onResize: (noteId: string, width: number, height: number) => void
  onChangeColor: (noteId: string, color: NoteColor) => void
}

interface NoteStyle extends CSSProperties {
  '--note-x': string
  '--note-y': string
  '--note-width': string
  '--note-height': string
}

interface MovementBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

interface DragSession extends MovementBounds {
  pointerId: number
  startClientX: number
  startClientY: number
  startX: number
  startY: number
  hasMoved: boolean
  element: HTMLElement
}

interface ResizeSession {
  pointerId: number
  startClientX: number
  startClientY: number
  startWidth: number
  startHeight: number
  minWidth: number
  minHeight: number
  maxWidth: number
  maxHeight: number
  element: HTMLElement
}

function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    return (min + max) / 2
  }

  return Math.min(Math.max(value, min), max)
}

function readPixelValue(value: string): number {
  const parsedValue = Number.parseFloat(value)
  return Number.isFinite(parsedValue) ? parsedValue : 0
}

function getMovementBounds(
  boardElement: HTMLElement,
  noteElement: HTMLElement,
  currentX: number,
  currentY: number,
): MovementBounds {
  const boardRect = boardElement.getBoundingClientRect()
  const noteRect = noteElement.getBoundingClientRect()
  const boardStyle = globalThis.getComputedStyle(boardElement)
  const leftBoundary =
    boardRect.left + readPixelValue(boardStyle.paddingLeft)
  const rightBoundary =
    boardRect.right - readPixelValue(boardStyle.paddingRight)
  const topBoundary = boardRect.top + readPixelValue(boardStyle.paddingTop)
  const bottomBoundary =
    boardRect.bottom - readPixelValue(boardStyle.paddingBottom)

  return {
    minX: currentX + leftBoundary - noteRect.left,
    maxX: currentX + rightBoundary - noteRect.right,
    minY: currentY + topBoundary - noteRect.top,
    maxY: currentY + bottomBoundary - noteRect.bottom,
  }
}

export function StickyNote({
  note,
  onDelete,
  onUpdate,
  onMove,
  onResize,
  onChangeColor,
}: StickyNoteProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(note.title)
  const [draftContent, setDraftContent] = useState(note.content)
  const noteElementRef = useRef<HTMLElement>(null)
  const dragSessionRef = useRef<DragSession | null>(null)
  const resizeSessionRef = useRef<ResizeSession | null>(null)
  const titleId = `note-title-${note.id}`
  const noteStyle: NoteStyle = {
    '--note-x': `${note.x}px`,
    '--note-y': `${note.y}px`,
    '--note-width': `${note.width}px`,
    '--note-height': `${note.height}px`,
  }
  const noteClassName = `sticky-note sticky-note--${note.color}${isDragging ? ' sticky-note--dragging' : ''}${isResizing ? ' sticky-note--resizing' : ''}${isEditing ? ' sticky-note--editing' : ''}`

  useEffect(() => {
    function constrainPosition() {
      const noteElement = noteElementRef.current
      const boardElement = noteElement?.closest('.board')

      if (
        dragSessionRef.current !== null ||
        resizeSessionRef.current !== null ||
        !(noteElement instanceof HTMLElement) ||
        !(boardElement instanceof HTMLElement)
      ) {
        return
      }

      const bounds = getMovementBounds(
        boardElement,
        noteElement,
        note.x,
        note.y,
      )
      const nextX = clamp(note.x, bounds.minX, bounds.maxX)
      const nextY = clamp(note.y, bounds.minY, bounds.maxY)

      if (Math.abs(nextX - note.x) > 0.5 || Math.abs(nextY - note.y) > 0.5) {
        onMove(note.id, nextX, nextY)
      }
    }

    globalThis.addEventListener('resize', constrainPosition)
    return () => globalThis.removeEventListener('resize', constrainPosition)
  }, [note.id, note.x, note.y, onMove])

  useEffect(() => {
    return () => {
      const dragSession = dragSessionRef.current
      const resizeSession = resizeSessionRef.current
      dragSessionRef.current = null
      resizeSessionRef.current = null

      if (
        dragSession !== null &&
        dragSession.element.hasPointerCapture(dragSession.pointerId)
      ) {
        dragSession.element.releasePointerCapture(dragSession.pointerId)
      }

      if (
        resizeSession !== null &&
        resizeSession.element.hasPointerCapture(resizeSession.pointerId)
      ) {
        resizeSession.element.releasePointerCapture(resizeSession.pointerId)
      }
    }
  }, [])

  function handleStartEditing() {
    setDraftTitle(note.title)
    setDraftContent(note.content)
    setIsEditing(true)
  }

  function handleSave() {
    onUpdate(note.id, draftTitle, draftContent)
    setIsEditing(false)
  }

  function handleCancel() {
    setDraftTitle(note.title)
    setDraftContent(note.content)
    setIsEditing(false)
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (
      isEditing ||
      isResizing ||
      dragSessionRef.current !== null ||
      resizeSessionRef.current !== null ||
      event.button !== 0 ||
      !(event.target instanceof Element)
    ) {
      return
    }

    if (event.target.closest(INTERACTIVE_SELECTOR) !== null) {
      return
    }

    if (
      event.pointerType === 'touch' &&
      event.target.closest('.sticky-note__body') !== null
    ) {
      return
    }

    const boardElement = event.currentTarget.closest('.board')

    if (!(boardElement instanceof HTMLElement)) {
      return
    }

    const bounds = getMovementBounds(
      boardElement,
      event.currentTarget,
      note.x,
      note.y,
    )

    dragSessionRef.current = {
      ...bounds,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: note.x,
      startY: note.y,
      hasMoved: false,
      element: event.currentTarget,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    const dragSession = dragSessionRef.current

    if (dragSession === null || dragSession.pointerId !== event.pointerId) {
      return
    }

    const deltaX = event.clientX - dragSession.startClientX
    const deltaY = event.clientY - dragSession.startClientY

    if (
      !dragSession.hasMoved &&
      Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD
    ) {
      return
    }

    dragSession.hasMoved = true
    event.preventDefault()
    setIsDragging(true)
    onMove(
      note.id,
      clamp(
        dragSession.startX + deltaX,
        dragSession.minX,
        dragSession.maxX,
      ),
      clamp(
        dragSession.startY + deltaY,
        dragSession.minY,
        dragSession.maxY,
      ),
    )
  }

  function finishDragging(event: ReactPointerEvent<HTMLElement>) {
    const dragSession = dragSessionRef.current

    if (dragSession === null || dragSession.pointerId !== event.pointerId) {
      return
    }

    dragSessionRef.current = null
    setIsDragging(false)

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function handleLostPointerCapture(event: ReactPointerEvent<HTMLElement>) {
    if (dragSessionRef.current?.pointerId === event.pointerId) {
      dragSessionRef.current = null
      setIsDragging(false)
    }
  }

  function handleResizePointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    if (
      isEditing ||
      isDragging ||
      dragSessionRef.current !== null ||
      resizeSessionRef.current !== null ||
      event.button !== 0
    ) {
      return
    }

    const noteElement = noteElementRef.current
    const boardElement = noteElement?.closest('.board')

    if (
      !(noteElement instanceof HTMLElement) ||
      !(boardElement instanceof HTMLElement)
    ) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const boardRect = boardElement.getBoundingClientRect()
    const noteRect = noteElement.getBoundingClientRect()
    const boardStyle = globalThis.getComputedStyle(boardElement)
    const rightBoundary =
      boardRect.right - readPixelValue(boardStyle.paddingRight)
    const availableWidth = rightBoundary - noteRect.left - 4
    const maxWidth = Math.min(
      MAX_NOTE_WIDTH,
      Math.max(MIN_NOTE_WIDTH, availableWidth),
    )

    resizeSessionRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startWidth: noteElement.offsetWidth,
      startHeight: noteElement.offsetHeight,
      minWidth: MIN_NOTE_WIDTH,
      minHeight: MIN_NOTE_HEIGHT,
      maxWidth,
      maxHeight: MAX_NOTE_HEIGHT,
      element: event.currentTarget,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsResizing(true)
  }

  function handleResizePointerMove(
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    const resizeSession = resizeSessionRef.current

    if (resizeSession === null || resizeSession.pointerId !== event.pointerId) {
      return
    }

    const deltaX = event.clientX - resizeSession.startClientX
    const deltaY = event.clientY - resizeSession.startClientY
    const nextWidth = clamp(
      resizeSession.startWidth + deltaX,
      resizeSession.minWidth,
      resizeSession.maxWidth,
    )
    const nextHeight = clamp(
      resizeSession.startHeight + deltaY,
      resizeSession.minHeight,
      resizeSession.maxHeight,
    )

    event.preventDefault()
    event.stopPropagation()
    onResize(note.id, nextWidth, nextHeight)
  }

  function finishResizing(event: ReactPointerEvent<HTMLButtonElement>) {
    const resizeSession = resizeSessionRef.current

    if (resizeSession === null || resizeSession.pointerId !== event.pointerId) {
      return
    }

    event.stopPropagation()
    resizeSessionRef.current = null
    setIsResizing(false)

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function handleResizeLostPointerCapture(
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    event.stopPropagation()

    if (resizeSessionRef.current?.pointerId === event.pointerId) {
      resizeSessionRef.current = null
      setIsResizing(false)
    }
  }

  return (
    <article
      ref={noteElementRef}
      className={noteClassName}
      style={noteStyle}
      aria-label={isEditing ? '메모 편집' : undefined}
      aria-labelledby={isEditing ? undefined : titleId}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDragging}
      onPointerCancel={finishDragging}
      onLostPointerCapture={handleLostPointerCapture}
    >
      {isEditing ? (
        <div className="sticky-note__form">
          <input
            className="sticky-note__title-input"
            type="text"
            aria-label="메모 제목"
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
          />
          <textarea
            className="sticky-note__content-input"
            aria-label="메모 내용"
            value={draftContent}
            onChange={(event) => setDraftContent(event.target.value)}
          />
          <div className="sticky-note__form-actions">
            <button
              className="sticky-note__cancel"
              type="button"
              onClick={handleCancel}
            >
              취소
            </button>
            <button
              className="sticky-note__save"
              type="button"
              onClick={handleSave}
            >
              저장
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="sticky-note__actions">
            <button
              className="sticky-note__edit"
              type="button"
              aria-label={`${note.title} 메모 편집`}
              onClick={handleStartEditing}
            >
              편집
            </button>
            <button
              className="sticky-note__delete"
              type="button"
              aria-label={`${note.title} 메모 삭제`}
              onClick={() => onDelete(note.id)}
            >
              ×
            </button>
          </div>
          <div className="sticky-note__view">
            <h2 id={titleId}>{note.title}</h2>
            <div className="sticky-note__body">
              <p>{note.content}</p>
            </div>
            <div
              className="sticky-note__color-palette"
              role="group"
              aria-label="메모 색상"
            >
              {NOTE_COLORS.map((color) => (
                <button
                  key={color}
                  className={`sticky-note__color-option sticky-note__color-option--${color}`}
                  type="button"
                  aria-label={`${COLOR_LABELS[color]} 메모`}
                  aria-pressed={note.color === color}
                  onClick={() => onChangeColor(note.id, color)}
                />
              ))}
            </div>
          </div>
          <button
            className="sticky-note__resize-handle"
            type="button"
            aria-label={`${note.title} 메모 크기 조절`}
            onPointerDown={handleResizePointerDown}
            onPointerMove={handleResizePointerMove}
            onPointerUp={finishResizing}
            onPointerCancel={finishResizing}
            onLostPointerCapture={handleResizeLostPointerCapture}
          >
            <span aria-hidden="true" />
          </button>
        </>
      )}
    </article>
  )
}
