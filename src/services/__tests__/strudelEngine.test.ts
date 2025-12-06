import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as StrudelEngine from '../strudelEngine';

describe('strudelEngine service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete window.repl;
    delete window.replAudio;
  });

  describe('getReplInstance', () => {
    it('returns undefined when repl not initialized', () => {
      expect(StrudelEngine.getReplInstance()).toBeUndefined();
    });

    it('returns repl when initialized', () => {
      const mockRepl = { evaluate: vi.fn(), stop: vi.fn() };
      window.repl = mockRepl;
      expect(StrudelEngine.getReplInstance()).toBe(mockRepl);
    });
  });

  describe('getAudioContext', () => {
    it('returns undefined when AudioContext not initialized', () => {
      expect(StrudelEngine.getAudioContext()).toBeUndefined();
    });

    it('returns AudioContext when initialized', () => {
      const mockContext = {} as AudioContext;
      window.replAudio = mockContext;
      expect(StrudelEngine.getAudioContext()).toBe(mockContext);
    });
  });

  describe('isEngineReady', () => {
    it('returns false when repl not initialized', () => {
      expect(StrudelEngine.isEngineReady()).toBe(false);
    });

    it('returns false when repl missing evaluate method', () => {
      window.repl = { stop: vi.fn() };
      expect(StrudelEngine.isEngineReady()).toBe(false);
    });

    it('returns false when repl missing stop method', () => {
      window.repl = { evaluate: vi.fn() };
      expect(StrudelEngine.isEngineReady()).toBe(false);
    });

    it('returns true when repl fully initialized', () => {
      window.repl = { evaluate: vi.fn(), stop: vi.fn() };
      expect(StrudelEngine.isEngineReady()).toBe(true);
    });
  });

  describe('playTestPattern', () => {
    it('returns false when repl not ready', () => {
      expect(StrudelEngine.playTestPattern()).toBe(false);
    });

    it('returns false when repl missing evaluate', () => {
      window.repl = { stop: vi.fn() };
      expect(StrudelEngine.playTestPattern()).toBe(false);
    });

    it('calls evaluate with test pattern when repl ready', () => {
      const mockEvaluate = vi.fn();
      window.repl = { evaluate: mockEvaluate, stop: vi.fn() };

      const result = StrudelEngine.playTestPattern();

      expect(result).toBe(true);
      expect(mockEvaluate).toHaveBeenCalledWith('s("bd*4").gain(0.8)');
      expect(mockEvaluate).toHaveBeenCalledTimes(1);
    });

    it('uses provided repl instance instead of window.repl', () => {
      const mockEvaluate = vi.fn();
      const customRepl = { evaluate: mockEvaluate, stop: vi.fn() };

      const result = StrudelEngine.playTestPattern(customRepl);

      expect(result).toBe(true);
      expect(mockEvaluate).toHaveBeenCalledWith('s("bd*4").gain(0.8)');
    });
  });

  describe('hushAudio', () => {
    it('returns false when repl not ready', () => {
      expect(StrudelEngine.hushAudio()).toBe(false);
    });

    it('returns false when repl missing stop', () => {
      window.repl = { evaluate: vi.fn() };
      expect(StrudelEngine.hushAudio()).toBe(false);
    });

    it('calls stop when repl ready', () => {
      const mockStop = vi.fn();
      window.repl = { evaluate: vi.fn(), stop: mockStop };

      const result = StrudelEngine.hushAudio();

      expect(result).toBe(true);
      expect(mockStop).toHaveBeenCalled();
      expect(mockStop).toHaveBeenCalledTimes(1);
    });

    it('uses provided repl instance instead of window.repl', () => {
      const mockStop = vi.fn();
      const customRepl = { evaluate: vi.fn(), stop: mockStop };

      const result = StrudelEngine.hushAudio(customRepl);

      expect(result).toBe(true);
      expect(mockStop).toHaveBeenCalled();
    });
  });
});
