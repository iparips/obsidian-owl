# Design: Desktop MVP

Covers release 1 of [2-plan.md](../2-plan.md): the full loop on desktop with record-then-transcribe capture. Modules referenced in brackets: UI, Capture, Providers, Engine, plus the external systems Obsidian and Mistral.

## Module Map

```mermaid
flowchart LR
    Main["VoiceEditPlugin [Main]<br/>Responsibility: owns plugin lifecycle by registering views, commands and settings"]
    View["SessionView [UI]<br/>Responsibility: owns the sidebar by rendering history, mic button and text box"]
    Rec["Recorder [Capture]<br/>Responsibility: owns the mic by recording one utterance per start-stop cycle"]
    Prov["MistralProvider [Providers]<br/>Responsibility: owns API access by implementing transcription and chat"]
    Eng["EditEngine [Engine]<br/>Responsibility: owns the model loop by turning an utterance into validated operations"]
    App["EditApplier [Engine]<br/>Responsibility: owns note mutation by resolving anchors and applying operations"]
    Ed["Editor API [Obsidian]<br/>Responsibility: owns the document by exposing range edits and undo"]

    Main --> View
    View --> Rec
    View --> Eng
    View -->|"transcribe"| Prov
    Eng -->|"complete"| Prov
    Eng --> App
    App --> Ed
```

Arrows: uses-relationship (client to supplier).

## Provider Interface

- TranscriptionProvider [Providers]: transcribe(audio, language) returns text. MVP implementation posts the recorded blob to Mistral's batch endpoint.
- ChatProvider [Providers]: complete(messages, tools) returns tool calls or text.
- MistralProvider [Providers] implements both. The interfaces are the seam FR26 requires; no second implementation ships in this release.

## Utterance Flow

```mermaid
sequenceDiagram
    participant View as SessionView [UI]
    participant Rec as Recorder [Capture]
    participant Prov as MistralProvider [Providers]
    participant Eng as EditEngine [Engine]
    participant App as EditApplier [Engine]
    participant Ed as Editor API [Obsidian]

    View->>Rec: start
    View->>Rec: stop
    Rec-->>View: audio blob
    View->>Prov: transcribe
    Prov-->>View: transcript
    View->>Eng: processUtterance

    Note over Eng,App: TOOL LOOP
    Eng->>Prov: complete
    Prov-->>Eng: tool calls
    Eng->>App: apply
    App->>Ed: replaceRange
    App-->>Eng: operation result
    Eng->>Prov: complete
    Prov-->>Eng: final text
    Eng-->>View: turn summary
```

Arrows: uses-relationship (client to supplier).

The loop repeats while the model returns tool calls. A text-only response ends the turn; it is either a summary or a clarifying question, and SessionView renders it in the history either way.

## Edit Tools

| Tool         | Arguments                                      | Effect                                 |
| ------------ | ---------------------------------------------- | -------------------------------------- |
| replace_text | anchor_text, replacement                       | Replaces the unique anchor match       |
| insert_text  | anchor_text, position (before/after), content  | Inserts content adjacent to the anchor |
| insert_at    | location (note_start/note_end/cursor), content | Inserts at a fixed location            |

- The system prompt carries the full note content, the cursor position, and the dictation-formatting rules (FR15-21).
- One turn may contain several tool calls (FR14); they apply in order.

## Anchor Resolution

- An anchor must match the note text exactly and uniquely.
- Zero matches or multiple matches fail the operation; the failure is returned to the model as the tool result, and the model retries with a longer anchor or asks the user (FR13).
- Offsets are recomputed after each applied operation, since earlier operations shift positions.

## Conversation State

- EditSession [Engine] holds the bound file, the message history, and the applied-operation log.
- History is provider-format messages, so follow-ups reuse the same array (FR4).
- The note content is re-read and re-sent each turn; the note may have been edited by hand between utterances.

## Error Handling

- Each layer returns an Outcome; SessionView is the only place that renders errors, naming the failing step (NFR5).
- A failed transcription leaves the history untouched. A failed operation mid-turn stops the turn; already-applied operations stay, and the summary says what landed.
