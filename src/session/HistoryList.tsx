import { Entry } from './panel-state'

const ENTRY_CLASSES = {
  user: 'voice-edit-entry-user',
  assistant: 'voice-edit-entry-assistant',
  error: 'voice-edit-entry-error',
}

export const HistoryList = ({ entries }: { entries: Entry[] }) => (
  <div className="voice-edit-history">
    {entries.map((entry, index) => (
      <div key={index} className={`voice-edit-entry ${ENTRY_CLASSES[entry.kind]}`}>
        {entry.kind === 'error' ? `${entry.step} failed: ${entry.text}` : entry.text}
      </div>
    ))}
  </div>
)
