import { TFile } from 'obsidian'
import { ChatMessage } from '../providers/types'
import { EditOperation } from '../engine/edit-applier'

export class EditSession {
  history: ChatMessage[] = []
  operationLog: EditOperation[] = []

  constructor(readonly file: TFile) {}
}
