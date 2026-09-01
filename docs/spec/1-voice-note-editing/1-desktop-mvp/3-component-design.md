# Desktop MVP: Component Design

Implementation detail for the engine and capture components. UI components are in [4-settings-ui.md](4-settings-ui.md).

## Tool Schemas (src/engine/tool-schemas.ts)

Free functions building the tool schema list and the system prompt; no state. Three tools, matching the EditOperation union in [2-data-model.md](2-data-model.md).

```json
{
  "name": "replace_text",
  "description": "Replace one exact, unique occurrence of anchor_text with replacement.",
  "parameters": {
    "type": "object",
    "properties": {
      "anchor_text": {
        "type": "string",
        "description": "Exact text currently in the note. Must match exactly once. Include enough surrounding text to be unique."
      },
      "replacement": { "type": "string" }
    },
    "required": ["anchor_text", "replacement"]
  }
}
```

insert_text adds position (before/after) instead of replacement; insert_at takes location (note_start/note_end/cursor) and content. Descriptions carry the uniqueness rule verbatim; it is the main lever against bad anchors.

## System Prompt

Built per turn by tool-schemas.ts with three sections.

1. Role and rules: you edit one markdown note via the provided tools; never rewrite the whole note; if the instruction is ambiguous, ask instead of guessing; multi-part instructions become multiple tool calls in order.
2. Dictation rules (FR15-21): classify the utterance as content, instruction, or a mix; clean fillers and self-corrections; format content with markdown - enumerations become lists, spoken cues become headings; content goes to the cursor unless directed elsewhere.
3. Context: the full note content fenced, the cursor line number, and the note path.

The note content is re-read from the editor at the start of every turn, never cached across turns.

## Tool Loop (edit-engine.ts)

```
processUtterance(text):
  push user message onto session history
  loop up to 6 iterations:
    turn = chatProvider.complete(system + history, tools)
    if turn is text: push assistant message, return it as the turn summary
    for each tool call in order:
      op = parse and validate args        -> invalid: tool result "invalid arguments: <why>"
      result = editApplier.apply(op)
      push tool result message ("applied" or the failure reason)
  return failure Outcome: "edit loop exceeded 6 iterations"
```

- Validation failures and apply failures both go back as tool results; the model corrects itself (FR13).
- The iteration cap prevents loops; hitting it is surfaced as a chat-step error.
- A text response is a summary or a clarifying question (FR12); SessionView renders it either way and the next utterance continues the same history.

## Anchor Resolution (edit-applier.ts)

```
apply(op):
  content = editor.getValue()
  matches = indexOfAll(content, op.anchor)
  if matches.length == 0: return noMatch
  if matches.length > 1: return multipleMatches
  editor.replaceRange(...)   convert offset to EditorPosition
  return applied
```

- Matching is exact string equality, no trimming, no fuzz.
- Each operation re-reads the live content, so earlier operations in the same turn shift nothing.
- insertAt cursor uses the cursor position captured when the utterance started, not the live cursor; the user may have tapped elsewhere while the model ran.
- All mutations go through editor.replaceRange, keeping native undo intact (FR22). After the last operation of a turn, the cursor moves to the end of the last edited range and the view scrolls to it (FR25).

## Turn Boundaries

- One utterance is one processUtterance call (per-utterance flush decision).
- The engine is single-flight: a new utterance while a turn runs is queued behind it, never interleaved.

## Recorder (src/capture/recorder.ts)

- getUserMedia audio with the default device; MediaRecorder with audio/webm preferred.
- start() begins a single recording; stop() resolves with the blob and mime type; cancel() discards without resolving.
- Mic permission failure returns a transcription-step Outcome failure.
- Stateless between utterances; each cycle creates a fresh MediaRecorder.
