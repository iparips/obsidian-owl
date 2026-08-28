import { FailureStep } from '../engine/outcome'

export type Phase = 'idle' | 'recording' | 'transcribing' | 'thinking'

export type Entry =
  | { kind: 'user'; text: string }
  | { kind: 'assistant'; text: string }
  | { kind: 'error'; step: FailureStep; text: string }

export interface PanelState {
  phase: Phase
  entries: Entry[]
}

export type PanelAction =
  | { type: 'recordingStarted' }
  | { type: 'stopRequested' }
  | { type: 'cancelled' }
  | { type: 'transcript'; text: string }
  | { type: 'summary'; text: string }
  | { type: 'failed'; step: FailureStep; message: string }

export const INITIAL_PANEL_STATE: PanelState = { phase: 'idle', entries: [] }

export class PanelReducer {
  static reduce(state: PanelState, action: PanelAction): PanelState {
    switch (action.type) {
      case 'recordingStarted':
        return { ...state, phase: 'recording' }
      case 'stopRequested':
        return { ...state, phase: 'transcribing' }
      case 'cancelled':
        return { ...state, phase: 'idle' }
      case 'transcript':
        return {
          phase: 'thinking',
          entries: [...state.entries, { kind: 'user', text: action.text }],
        }
      case 'summary':
        return {
          phase: 'idle',
          entries: [...state.entries, { kind: 'assistant', text: action.text }],
        }
      case 'failed':
        return {
          phase: 'idle',
          entries: [...state.entries, { kind: 'error', step: action.step, text: action.message }],
        }
    }
  }
}
