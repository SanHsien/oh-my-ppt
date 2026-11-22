import { describe, expect, it, vi } from 'vitest'

vi.mock('electron-log/main.js', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

import {
  anthropicModelAcceptsTemperature,
  resolveModel
} from '../../../src/main/agent-runtime/model/resolve'

// Regression: current Claude models (Opus 4.7+, the Claude 5 family, Fable, Mythos)
// reject non-default temperature with a 400, and the call sites pass 0.2-0.65 by
// default. Sending it made every request to those models fail.

describe('anthropic temperature gating', () => {
  it('omits temperature for Claude models that reject sampling parameters', () => {
    for (const model of [
      'claude-opus-5-5',
      'claude-opus-5',
      'claude-opus-4-8',
      'claude-opus-4-7',
      'claude-sonnet-5-5',
      'claude-sonnet-5',
      'claude-haiku-5-5',
      'claude-fable-5-2',
      'claude-mythos-5-2',
      'anthropic/claude-opus-5-5'
    ]) {
      expect(anthropicModelAcceptsTemperature(model), model).toBe(false)
    }
  })

  it('keeps temperature for older Claude and non-Claude models', () => {
    for (const model of [
      'claude-opus-4-6',
      'claude-sonnet-4-6',
      'claude-haiku-4-5',
      'claude-3-7-sonnet-20250219',
      'MiniMax-M2.7'
    ]) {
      expect(anthropicModelAcceptsTemperature(model), model).toBe(true)
    }
  })

  it('does not put temperature on the ChatAnthropic client for current Claude models', () => {
    const current = resolveModel('anthropic', 'k', 'claude-opus-5-5', undefined, 0.25) as {
      temperature?: number
    }
    expect(current.temperature).toBeUndefined()

    const older = resolveModel('anthropic', 'k', 'claude-sonnet-4-6', undefined, 0.25) as {
      temperature?: number
    }
    expect(older.temperature).toBe(0.25)
  })
})
