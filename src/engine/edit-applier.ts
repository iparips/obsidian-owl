import { Editor, EditorPosition } from 'obsidian'
import { TextPositions } from './text-positions'

export type EditOperation =
  | { kind: 'replace'; anchor: string; replacement: string }
  | { kind: 'insert'; anchor: string; position: 'before' | 'after'; content: string }
  | { kind: 'insertAt'; location: 'noteStart' | 'noteEnd' | 'cursor'; content: string }

export type ApplyResult =
  { applied: true } | { applied: false; reason: 'noMatch' | 'multipleMatches' }

type AnchorMatch =
  { unique: true; index: number } | { unique: false; reason: 'noMatch' | 'multipleMatches' }

export class EditApplier {
  private lastEditEnd: EditorPosition | null = null

  constructor(
    private editor: Editor,
    private cursorAtStart: EditorPosition,
  ) {}

  apply(op: EditOperation): ApplyResult {
    if (op.kind === 'replace') return this.replaceAnchor(op.anchor, op.replacement)
    if (op.kind === 'insert') return this.insertAtAnchor(op.anchor, op.position, op.content)
    return this.insertAtLocation(op.location, op.content)
  }

  focusLastEdit(): void {
    if (!this.lastEditEnd) return
    this.editor.setCursor(this.lastEditEnd)
    this.editor.scrollIntoView({ from: this.lastEditEnd, to: this.lastEditEnd }, true)
  }

  private replaceAnchor(anchor: string, replacement: string): ApplyResult {
    const match = this.findAnchor(anchor)
    if (!match.unique) return { applied: false, reason: match.reason }
    this.replaceOffsets(match.index, match.index + anchor.length, replacement)
    return { applied: true }
  }

  private insertAtAnchor(
    anchor: string,
    position: 'before' | 'after',
    content: string,
  ): ApplyResult {
    const match = this.findAnchor(anchor)
    if (!match.unique) return { applied: false, reason: match.reason }
    const offset = position === 'before' ? match.index : match.index + anchor.length
    this.replaceOffsets(offset, offset, content)
    return { applied: true }
  }

  private insertAtLocation(
    location: 'noteStart' | 'noteEnd' | 'cursor',
    content: string,
  ): ApplyResult {
    const offset = this.locationOffset(location)
    this.replaceOffsets(offset, offset, content)
    return { applied: true }
  }

  private locationOffset(location: 'noteStart' | 'noteEnd' | 'cursor'): number {
    const content = this.editor.getValue()
    if (location === 'noteStart') return 0
    if (location === 'noteEnd') return content.length
    return TextPositions.posToOffset(content, this.cursorAtStart)
  }

  private findAnchor(anchor: string): AnchorMatch {
    const content = this.editor.getValue()
    const first = content.indexOf(anchor)
    if (first === -1) return { unique: false, reason: 'noMatch' }
    if (content.indexOf(anchor, first + 1) !== -1)
      return { unique: false, reason: 'multipleMatches' }
    return { unique: true, index: first }
  }

  private replaceOffsets(from: number, to: number, text: string): void {
    const content = this.editor.getValue()
    const start = TextPositions.offsetToPos(content, from)
    this.editor.replaceRange(text, start, TextPositions.offsetToPos(content, to))
    this.lastEditEnd = TextPositions.offsetToPos(this.editor.getValue(), from + text.length)
  }
}
