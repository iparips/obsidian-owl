import { Outcome, Outcomes } from '../engine/outcome'

export interface Utterance {
  blob: Blob
  mimeType: string
}

const PREFERRED_MIME_TYPE = 'audio/webm'

export class Recorder {
  private recorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  private mimeType = PREFERRED_MIME_TYPE

  async start(): Promise<Outcome<void>> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.beginRecording(stream)
      return Outcomes.success(undefined)
    } catch (error) {
      return Outcomes.failure('transcription', `microphone unavailable: ${String(error)}`)
    }
  }

  stop(): Promise<Utterance> {
    return new Promise((resolve) => {
      const recorder = this.recorder
      if (!recorder)
        return resolve({ blob: new Blob([], { type: this.mimeType }), mimeType: this.mimeType })
      recorder.onstop = () => resolve(this.takeUtterance(recorder))
      recorder.stop()
    })
  }

  cancel(): void {
    const recorder = this.recorder
    if (!recorder) return
    recorder.onstop = () => this.releaseStream(recorder)
    recorder.stop()
    this.reset()
  }

  private beginRecording(stream: MediaStream): void {
    this.mimeType = MediaRecorder.isTypeSupported(PREFERRED_MIME_TYPE) ? PREFERRED_MIME_TYPE : ''
    this.chunks = []
    this.recorder = new MediaRecorder(
      stream,
      this.mimeType ? { mimeType: this.mimeType } : undefined,
    )
    this.recorder.ondataavailable = (event) => this.chunks.push(event.data)
    this.recorder.start()
  }

  private takeUtterance(recorder: MediaRecorder): Utterance {
    const mimeType = this.mimeType || recorder.mimeType || PREFERRED_MIME_TYPE
    const utterance = { blob: new Blob(this.chunks, { type: mimeType }), mimeType }
    this.releaseStream(recorder)
    this.reset()
    return utterance
  }

  private releaseStream(recorder: MediaRecorder): void {
    recorder.stream.getTracks().forEach((track) => track.stop())
  }

  private reset(): void {
    this.recorder = null
    this.chunks = []
  }
}
