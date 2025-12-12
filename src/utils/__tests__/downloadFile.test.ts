import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { downloadFile, generateScriptFilename } from '../downloadFile';

describe('downloadFile', () => {
  let createElementSpy: ReturnType<typeof vi.spyOn>;
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let mockAnchor: HTMLAnchorElement;

  beforeEach(() => {
    // Create a mock anchor element
    mockAnchor = document.createElement('a');
    mockAnchor.click = vi.fn();

    // Spy on document.createElement to return our mock anchor
    createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);

    // Spy on URL methods
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');
  });

  afterEach(() => {
    createElementSpy.mockRestore();
    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });

  it('creates a blob with the correct content and MIME type', () => {
    const content = 'console.log("test")';
    const filename = 'test.js';
    const mimeType = 'text/javascript';

    downloadFile(content, filename, mimeType);

    // Verify blob was created
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    const blob = createObjectURLSpy.mock.calls[0][0] as Blob;
    expect(blob.type).toBe(mimeType);
  });

  it('creates an anchor element with correct attributes', () => {
    const content = 'console.log("test")';
    const filename = 'test.js';

    downloadFile(content, filename);

    expect(mockAnchor.href).toBe('blob:mock-url');
    expect(mockAnchor.download).toBe(filename);
  });

  it('triggers the download by clicking the anchor', () => {
    downloadFile('test content', 'test.txt');

    expect(mockAnchor.click).toHaveBeenCalledTimes(1);
  });

  it('cleans up by revoking the object URL', () => {
    downloadFile('test content', 'test.txt');

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
  });

  it('uses default MIME type when not specified', () => {
    downloadFile('test', 'file.txt');

    const blob = createObjectURLSpy.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('text/plain');
  });
});

describe('generateScriptFilename', () => {
  it('generates filename with correct format', () => {
    const filename = generateScriptFilename();

    // Should match: strudel-YYYY-MM-DD-HHmmssSSS.strudel.js
    expect(filename).toMatch(/^strudel-\d{4}-\d{2}-\d{2}-\d{9}\.strudel\.js$/);
  });

  it('generates filename with current date components', () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const filename = generateScriptFilename();

    expect(filename).toContain(`strudel-${year}-${month}-${day}`);
  });

  it('includes .strudel.js extension', () => {
    const filename = generateScriptFilename();

    expect(filename.endsWith('.strudel.js')).toBe(true);
  });

  it('generates filenames with millisecond precision', () => {
    // Use fake timers to control time precisely
    vi.useFakeTimers();

    // Set initial time with milliseconds
    vi.setSystemTime(new Date('2024-01-15T10:30:45.123Z'));
    const filename1 = generateScriptFilename();

    // Advance time by 1 millisecond
    vi.setSystemTime(new Date('2024-01-15T10:30:45.124Z'));
    const filename2 = generateScriptFilename();

    // Restore real timers
    vi.useRealTimers();

    // Both should have correct format
    expect(filename1).toMatch(/^strudel-\d{4}-\d{2}-\d{2}-\d{9}\.strudel\.js$/);
    expect(filename2).toMatch(/^strudel-\d{4}-\d{2}-\d{2}-\d{9}\.strudel\.js$/);

    // Filenames should be different (different milliseconds)
    expect(filename1).not.toBe(filename2);
  });
});
