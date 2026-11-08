/**
 * Bulletproof clipboard helper:
 * 1. Tries modern navigator.clipboard.writeText
 * 2. Falls back to hidden offscreen textarea + document.execCommand('copy')
 * 3. Never throws; returns { success: boolean, error?: string }
 */
export async function copyToClipboard(text) {
  if (typeof text !== 'string') {
    text = String(text || '');
  }

  // 1. Try modern asynchronous Clipboard API
  if (navigator?.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true };
    } catch (err) {
      console.warn('navigator.clipboard.writeText failed, trying fallback:', err);
    }
  }

  // 2. Fallback: Hidden offscreen textarea + execCommand('copy')
  if (typeof document !== 'undefined' && document.body) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      // Position outside visible screen
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);

      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        return { success: true };
      }
      return { success: false, error: 'execCommand returned false' };
    } catch (fallbackErr) {
      console.error('Fallback clipboard copy failed:', fallbackErr);
      return { success: false, error: fallbackErr.message };
    }
  }

  return { success: false, error: 'No DOM document available' };
}
