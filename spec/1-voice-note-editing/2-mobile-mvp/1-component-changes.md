# Mobile MVP: Component Changes

Three components change; nothing else does. manifest.json drops isDesktopOnly.

## VoiceEditPlugin (src/main.ts)

- Registers the session-start command with the mobile toolbar in mind: Obsidian surfaces any command in the mobile toolbar once the user adds it, so the plugin ships an icon on the command and documents adding it to the toolbar (FR1).
- No Platform branching in main.ts; the command works identically on both platforms.

## Recorder (src/capture/recorder.ts)

Mime type probing replaces the fixed webm preference.

```typescript
const MIME_PREFERENCES = ['audio/webm', 'audio/mp4', 'audio/aac']

// pick the first for which MediaRecorder.isTypeSupported returns true
```

- iOS WebKit records audio/mp4 (AAC); Android records audio/webm (Opus). The chosen type rides with the blob, and MistralProvider passes it through to the multipart request (no client-side transcoding).
- Permission is requested lazily on first record; a denial surfaces as a transcription-step error entry.
- App backgrounding mid-recording stops and discards, with a notice. Configurable behaviour is Mobile V1 scope.

## SessionPanel (src/session/SessionPanel.tsx)

- CSS only: minimum 44px touch targets on mic, send and cancel; no hover-dependent affordances (FR33).
- The drawer presentation is native Obsidian behaviour for right-sidebar views on mobile; no code change (FR3).
