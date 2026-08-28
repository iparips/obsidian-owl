import { ToolCall } from '../providers/types'
import { EditOperation } from './edit-applier'

export type ParsedOperation = { op: EditOperation } | { error: string }

const LOCATIONS: Record<string, 'noteStart' | 'noteEnd' | 'cursor'> = {
  note_start: 'noteStart',
  note_end: 'noteEnd',
  cursor: 'cursor',
}

export class OperationParser {
  static parse(call: ToolCall): ParsedOperation {
    if (call.name === 'replace_text') return OperationParser.parseReplace(call.args)
    if (call.name === 'insert_text') return OperationParser.parseInsert(call.args)
    if (call.name === 'insert_at') return OperationParser.parseInsertAt(call.args)
    return { error: `unknown tool ${call.name}` }
  }

  private static parseReplace(args: Record<string, unknown>): ParsedOperation {
    const anchor = args.anchor_text
    const replacement = args.replacement
    if (typeof anchor !== 'string' || typeof replacement !== 'string')
      return { error: 'anchor_text and replacement must be strings' }
    return { op: { kind: 'replace', anchor, replacement } }
  }

  private static parseInsert(args: Record<string, unknown>): ParsedOperation {
    const anchor = args.anchor_text
    const position = args.position
    const content = args.content
    if (typeof anchor !== 'string' || typeof content !== 'string')
      return { error: 'anchor_text and content must be strings' }
    if (position !== 'before' && position !== 'after')
      return { error: 'position must be before or after' }
    return { op: { kind: 'insert', anchor, position, content } }
  }

  private static parseInsertAt(args: Record<string, unknown>): ParsedOperation {
    const location = typeof args.location === 'string' ? LOCATIONS[args.location] : undefined
    const content = args.content
    if (typeof content !== 'string') return { error: 'content must be a string' }
    if (!location) return { error: 'location must be note_start, note_end or cursor' }
    return { op: { kind: 'insertAt', location, content } }
  }
}
