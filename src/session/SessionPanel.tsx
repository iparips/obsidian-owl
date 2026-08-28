import { useReducer, useState } from 'react'
import { Outcome } from '../engine/outcome'
import { Utterance } from '../capture/recorder'
import { HistoryList } from './HistoryList'
import { INITIAL_PANEL_STATE, PanelReducer } from './panel-state'

export interface RecorderPort {
  start(): Promise<Outcome<void>>
  stop(): Promise<Utterance>
  cancel(): void
}

export interface SessionPanelProps {
  noteName: string
  recorder: RecorderPort
  transcribe(blob: Blob, mimeType: string): Promise<Outcome<string>>
  processUtterance(text: string): Promise<Outcome<string>>
}

export const SessionPanel = (props: SessionPanelProps) => {
  const [state, dispatch] = useReducer(PanelReducer.reduce, INITIAL_PANEL_STATE)
  const [draft, setDraft] = useState('')

  const runTurn = async (text: string) => {
    dispatch({ type: 'transcript', text })
    const outcome = await props.processUtterance(text)
    if (outcome.ok) dispatch({ type: 'summary', text: outcome.value })
    else dispatch({ type: 'failed', step: outcome.step, message: outcome.message })
  }

  const startRecording = async () => {
    const outcome = await props.recorder.start()
    if (outcome.ok) dispatch({ type: 'recordingStarted' })
    else dispatch({ type: 'failed', step: outcome.step, message: outcome.message })
  }

  const stopRecording = async () => {
    dispatch({ type: 'stopRequested' })
    const utterance = await props.recorder.stop()
    const transcript = await props.transcribe(utterance.blob, utterance.mimeType)
    if (transcript.ok) await runTurn(transcript.value)
    else dispatch({ type: 'failed', step: transcript.step, message: transcript.message })
  }

  const cancelRecording = () => {
    props.recorder.cancel()
    dispatch({ type: 'cancelled' })
  }

  const sendDraft = async () => {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    await runTurn(text)
  }

  const recording = state.phase === 'recording'
  const busy = state.phase === 'transcribing' || state.phase === 'thinking'
  return (
    <div className="voice-edit-panel">
      <div className="voice-edit-header">{props.noteName}</div>
      <HistoryList entries={state.entries} />
      <div className="voice-edit-input-row">
        <button
          aria-label={recording ? 'Stop recording' : 'Record'}
          disabled={busy}
          onClick={recording ? stopRecording : startRecording}
        >
          {recording ? 'Stop' : 'Mic'}
        </button>
        {recording && (
          <button aria-label="Cancel" onClick={cancelRecording}>
            Cancel
          </button>
        )}
        <input
          aria-label="Instruction"
          value={draft}
          disabled={recording || busy}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && sendDraft()}
        />
        <button aria-label="Send" disabled={recording || busy} onClick={sendDraft}>
          Send
        </button>
      </div>
    </div>
  )
}
