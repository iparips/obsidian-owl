import { ToolSchema } from '../providers/types'

export interface NoteContext {
  path: string
  content: string
  cursorLine: number
}

const ANCHOR_DESCRIPTION =
  'Exact text currently in the note. Must match exactly once. Include enough surrounding text to be unique.'

export const TOOL_SCHEMAS: ToolSchema[] = [
  {
    name: 'replace_text',
    description: 'Replace one exact, unique occurrence of anchor_text with replacement.',
    parameters: {
      type: 'object',
      properties: {
        anchor_text: { type: 'string', description: ANCHOR_DESCRIPTION },
        replacement: { type: 'string' },
      },
      required: ['anchor_text', 'replacement'],
    },
  },
  {
    name: 'insert_text',
    description:
      'Insert content immediately before or after one exact, unique occurrence of anchor_text.',
    parameters: {
      type: 'object',
      properties: {
        anchor_text: { type: 'string', description: ANCHOR_DESCRIPTION },
        position: { type: 'string', enum: ['before', 'after'] },
        content: { type: 'string' },
      },
      required: ['anchor_text', 'position', 'content'],
    },
  },
  {
    name: 'insert_at',
    description: 'Insert content at a fixed location in the note.',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', enum: ['note_start', 'note_end', 'cursor'] },
        content: { type: 'string' },
      },
      required: ['location', 'content'],
    },
  },
]

export class PromptBuilder {
  static build(note: NoteContext): string {
    return [
      PromptBuilder.roleRules(),
      PromptBuilder.dictationRules(),
      PromptBuilder.context(note),
    ].join('\n\n')
  }

  private static roleRules(): string {
    return [
      'You edit one markdown note through the provided tools.',
      'Never rewrite the whole note; make the smallest targeted edits that satisfy the instruction.',
      'If the instruction is ambiguous, respond with a clarifying question instead of guessing.',
      'Multi-part instructions become multiple tool calls, applied in order.',
      'When you are done, respond with a one-sentence summary of what changed.',
    ].join('\n')
  }

  private static dictationRules(): string {
    return [
      'The user speaks utterances that are content to write down, an editing instruction, or a mix. Classify each utterance and act accordingly.',
      'For content: drop filler words, fix punctuation and capitalisation, and resolve self-corrections such as "no, not X, Y".',
      'Format content to fit the note: prose stays prose, enumerations become markdown lists, spoken structure cues become headings.',
      'Infer formatting intent from natural phrasing; there are no fixed trigger phrases.',
      'Content goes at the cursor unless the utterance directs it elsewhere.',
    ].join('\n')
  }

  private static context(note: NoteContext): string {
    return [
      `Note path: ${note.path}`,
      `Cursor line: ${note.cursorLine}`,
      'Note content:',
      '```markdown',
      note.content,
      '```',
    ].join('\n')
  }
}
