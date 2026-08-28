import { Notice, Plugin, TFile, WorkspaceLeaf } from 'obsidian'
import { Recorder } from './capture/recorder'
import { EditEngine } from './engine/edit-engine'
import { MistralProvider } from './providers/mistral-provider'
import { EditSession } from './session/edit-session'
import { WorkspaceNoteAccess } from './session/note-access'
import { RebindModal } from './session/rebind-modal'
import { SessionView, VIEW_TYPE_SESSION } from './session/session-view'
import { SessionPanelProps } from './session/SessionPanel'
import { DEFAULT_SETTINGS, VoiceEditSettings } from './settings/settings'
import { VoiceEditSettingsTab } from './settings/settings-tab'

export default class VoiceEditPlugin extends Plugin {
  settings: VoiceEditSettings = DEFAULT_SETTINGS

  async onload(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) }
    this.registerView(VIEW_TYPE_SESSION, (leaf) => new SessionView(leaf))
    this.addRibbonIcon('mic', 'Start voice edit session', () => this.openSession())
    this.addCommand({
      id: 'start-session',
      name: 'Start session for active note',
      callback: () => this.openSession(),
    })
    this.addSettingTab(new VoiceEditSettingsTab(this.app, this))
  }

  async updateSettings(update: Partial<VoiceEditSettings>): Promise<void> {
    this.settings = { ...this.settings, ...update }
    await this.saveData(this.settings)
  }

  private async openSession(): Promise<void> {
    const file = this.app.workspace.getActiveFile()
    if (!file) return void new Notice('Open a note first.')
    const view = await this.revealSessionView()
    if (!view) return
    this.bindOrAskRebind(view, file)
  }

  private bindOrAskRebind(view: SessionView, file: TFile): void {
    const boundName = view.boundNoteName()
    if (boundName && boundName !== file.basename)
      return new RebindModal(this.app, boundName, file.basename, () =>
        view.bindSession(this.buildPanelProps(file)),
      ).open()
    if (!boundName) view.bindSession(this.buildPanelProps(file))
  }

  private buildPanelProps(file: TFile): SessionPanelProps {
    const provider = new MistralProvider(this.settings.mistralApiKey, this.settings.editModel)
    const session = new EditSession(file)
    const engine = new EditEngine(provider, session, new WorkspaceNoteAccess(this.app, file))
    return {
      noteName: file.basename,
      recorder: new Recorder(),
      transcribe: (blob, mimeType) => provider.transcribe(blob, mimeType),
      processUtterance: (text) => engine.processUtterance(text),
    }
  }

  private async revealSessionView(): Promise<SessionView | null> {
    const leaf = this.sessionLeaf()
    if (!leaf) return null
    await this.app.workspace.revealLeaf(leaf)
    return leaf.view instanceof SessionView ? leaf.view : null
  }

  private sessionLeaf(): WorkspaceLeaf | null {
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_SESSION)[0]
    if (existing) return existing
    const leaf = this.app.workspace.getRightLeaf(false)
    leaf?.setViewState({ type: VIEW_TYPE_SESSION, active: true })
    return leaf
  }
}
