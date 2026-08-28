import { App, Editor, MarkdownView, TFile } from 'obsidian'
import { EditApplier } from '../engine/edit-applier'
import { NoteAccess, OpenNote } from '../engine/edit-engine'
import { Outcome, Outcomes } from '../engine/outcome'

export class WorkspaceNoteAccess implements NoteAccess {
  constructor(
    private app: App,
    private file: TFile,
  ) {}

  open(): Outcome<OpenNote> {
    const editor = this.findEditor()
    if (!editor) return Outcomes.failure('apply', 'the session note is not open in an editor')
    return Outcomes.success(this.openNote(editor))
  }

  private openNote(editor: Editor): OpenNote {
    const cursor = editor.getCursor()
    return {
      applier: new EditApplier(editor, cursor),
      context: () => ({
        path: this.file.path,
        content: editor.getValue(),
        cursorLine: cursor.line,
      }),
    }
  }

  private findEditor(): Editor | null {
    const leaves = this.app.workspace.getLeavesOfType('markdown')
    const match = leaves
      .map((leaf) => leaf.view as MarkdownView)
      .find((view) => view.file?.path === this.file.path)
    return match?.editor ?? null
  }
}
