export type FailureStep = 'transcription' | 'chat' | 'apply'

export type Outcome<T> = { ok: true; value: T } | { ok: false; step: FailureStep; message: string }

export class Outcomes {
  static success<T>(value: T): Outcome<T> {
    return { ok: true, value }
  }

  static failure<T>(step: FailureStep, message: string): Outcome<T> {
    return { ok: false, step, message }
  }
}
