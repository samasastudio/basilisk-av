/**
 * Triggers a browser download for the given content.
 * Creates a temporary blob URL, triggers the download, and cleans up.
 *
 * @param content - The file content to download
 * @param filename - The name for the downloaded file
 * @param mimeType - The MIME type of the file (default: text/plain)
 */
export const downloadFile = (
  content: string,
  filename: string,
  mimeType: string = 'text/plain'
): void => {
  // Create a Blob with the content
  const blob = new Blob([content], { type: mimeType });

  // Create a temporary URL for the blob
  const url = URL.createObjectURL(blob);

  // Create a temporary anchor element to trigger the download
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;

  // Trigger the download
  document.body.appendChild(anchor);
  anchor.click();

  // Clean up
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

/**
 * Generates a timestamp-based filename for a Strudel script.
 * Format: strudel-YYYY-MM-DD-HHmmss.strudel.js
 *
 * @returns A filename with current timestamp
 */
export const generateScriptFilename = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `strudel-${year}-${month}-${day}-${hours}${minutes}${seconds}.strudel.js`;
};
