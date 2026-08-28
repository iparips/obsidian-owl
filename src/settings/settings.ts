export interface VoiceEditSettings {
  provider: 'mistral'
  mistralApiKey: string
  editModel: string
}

export const DEFAULT_SETTINGS: VoiceEditSettings = {
  provider: 'mistral',
  mistralApiKey: '',
  editModel: 'mistral-medium-latest',
}
