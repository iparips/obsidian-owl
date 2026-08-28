# Voice Edit

An Obsidian plugin that edits the active note from natural-language instructions, spoken or typed. Speak "rename heading Budget to Costs" or "add a list A, B, C under heading X" and the note changes. Dictated content lands formatted as markdown. Powered by Mistral speech-to-text and chat models, using your own API key.

Specs live in [spec/1-voice-note-editing](spec/1-voice-note-editing/1-requirements.md).

## Prerequisites

- [Bun](https://bun.sh) installed
- Obsidian 1.5.0 or newer on desktop
- A [Mistral API key](https://console.mistral.ai/)

## Build and Test

```bash
bun install         # once, installs dependencies
bun run test        # run the unit test suite
bun run lint        # eslint
bun run build       # test + lint + format + bundle to main.js
```

The build produces main.js at the repo root, next to manifest.json and styles.css. Those three files are the plugin.

## Link Into Desktop Obsidian

Symlink the repo into your vault's plugin folder, so every rebuild is picked up without copying:

```bash
ln -s "$(pwd)" "<your-vault>/.obsidian/plugins/obsidian-voice-edit"
```

Run it from the repo root, replacing `<your-vault>` with your vault's path.

Then in Obsidian:

1. Settings, Community plugins: turn off Restricted mode if it is on.
2. Refresh installed plugins and enable Voice Edit.
3. Settings, Voice Edit: paste your Mistral API key.

After a rebuild, reload the plugin: toggle it off and on in Community plugins, or run the "Reload app without saving" command.

## Test It Out

1. Open any note and click the mic ribbon icon, or run "Start session for active note". The session panel opens in the right sidebar.
2. Type an instruction first, to prove the loop without the mic: "add a heading called Test at the start of the file", then Send.
3. Click Mic, say "rename heading Test to Done", click Stop. The transcript appears, then the edit lands.
4. Try dictation: "make a list of apples, bananas and pears under a heading called Shopping".
5. Try a follow-up: "actually make that heading level two".
6. Press Ctrl+Z / Cmd+Z in the note: the last edit undoes through the native history.

If a step fails, the panel shows an error entry naming the failing step: transcription, chat, or apply.

## Troubleshooting

- Mic errors: macOS needs microphone permission for Obsidian under System Settings, Privacy and Security.
- 401 errors: check the API key in settings.
- "note is not open in an editor": the session's note must stay open in a tab while you edit.
