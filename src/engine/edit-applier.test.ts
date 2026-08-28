import { describe, expect, it } from 'vitest'
import { EditApplier } from './edit-applier'
import { FakeEditor } from '../test-support/fake-editor'

const applierFor = (editor: FakeEditor) => new EditApplier(editor.asEditor(), editor.getCursor())

describe('EditApplier', () => {
  describe('when replacing', () => {
    it('applies replacement when the anchor matches exactly once', () => {
      const editor = new FakeEditor('# Budget\n\ntext')

      const result = applierFor(editor).apply({
        kind: 'replace',
        anchor: '# Budget',
        replacement: '# Costs',
      })

      expect(result).toEqual({ applied: true })
      expect(editor.content).toBe('# Costs\n\ntext')
    })

    it('returns noMatch when the anchor is absent', () => {
      const editor = new FakeEditor('# Budget')

      const result = applierFor(editor).apply({
        kind: 'replace',
        anchor: '# Missing',
        replacement: 'x',
      })

      expect(result).toEqual({ applied: false, reason: 'noMatch' })
    })

    it('returns multipleMatches when the anchor appears twice', () => {
      const editor = new FakeEditor('item\nitem')

      const result = applierFor(editor).apply({ kind: 'replace', anchor: 'item', replacement: 'x' })

      expect(result).toEqual({ applied: false, reason: 'multipleMatches' })
    })

    it('preserves surrounding content when applying in the middle of a line', () => {
      const editor = new FakeEditor('the quick brown fox')

      applierFor(editor).apply({ kind: 'replace', anchor: 'quick', replacement: 'slow' })

      expect(editor.content).toBe('the slow brown fox')
    })
  })

  describe('when inserting at an anchor', () => {
    it('inserts before the anchor when position is before', () => {
      const editor = new FakeEditor('## Heading\nbody')

      applierFor(editor).apply({
        kind: 'insert',
        anchor: 'body',
        position: 'before',
        content: 'intro\n',
      })

      expect(editor.content).toBe('## Heading\nintro\nbody')
    })

    it('inserts after the anchor when position is after', () => {
      const editor = new FakeEditor('## Heading\nbody')

      applierFor(editor).apply({
        kind: 'insert',
        anchor: '## Heading',
        position: 'after',
        content: '\nintro',
      })

      expect(editor.content).toBe('## Heading\nintro\nbody')
    })
  })

  describe('when inserting at a location', () => {
    it('inserts at note start when location is noteStart', () => {
      const editor = new FakeEditor('body')

      applierFor(editor).apply({ kind: 'insertAt', location: 'noteStart', content: 'top\n' })

      expect(editor.content).toBe('top\nbody')
    })

    it('inserts at note end when location is noteEnd', () => {
      const editor = new FakeEditor('body')

      applierFor(editor).apply({ kind: 'insertAt', location: 'noteEnd', content: '\nbottom' })

      expect(editor.content).toBe('body\nbottom')
    })

    it('inserts at the captured cursor when location is cursor', () => {
      const editor = new FakeEditor('line one\nline two')
      editor.cursor = { line: 1, ch: 0 }

      applierFor(editor).apply({ kind: 'insertAt', location: 'cursor', content: 'here ' })

      expect(editor.content).toBe('line one\nhere line two')
    })
  })
})
