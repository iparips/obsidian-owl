import { App, PluginSettingTab } from 'obsidian'
import { createRoot, Root } from 'react-dom/client'
import { SettingsPanel } from './SettingsPanel'
import { VoiceEditSettings } from './settings'

export interface SettingsHost {
  settings: VoiceEditSettings
  updateSettings(update: Partial<VoiceEditSettings>): Promise<void>
}

export class VoiceEditSettingsTab extends PluginSettingTab {
  private root: Root | null = null

  constructor(
    app: App,
    plugin: SettingsHost & ConstructorParameters<typeof PluginSettingTab>[1],
    private host: SettingsHost = plugin,
  ) {
    super(app, plugin)
  }

  display(): void {
    this.root = createRoot(this.containerEl)
    this.renderPanel()
  }

  hide(): void {
    this.root?.unmount()
    this.root = null
  }

  private renderPanel(): void {
    this.root?.render(
      <SettingsPanel
        settings={this.host.settings}
        onChange={(update) => this.applyUpdate(update)}
      />,
    )
  }

  private async applyUpdate(update: Partial<VoiceEditSettings>): Promise<void> {
    await this.host.updateSettings(update)
    this.renderPanel()
  }
}
