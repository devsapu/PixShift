/**
 * Social Media Sharing Utilities
 * Generates share links for Facebook, Twitter/X, and Instagram
 */

export interface ShareOptions {
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
}

/**
 * Generate Facebook share URL
 */
export function getFacebookShareUrl(options: ShareOptions): string {
  const params = new URLSearchParams({
    u: options.url,
  });

  if (options.title) {
    params.append('quote', options.title);
  }

  if (options.description) {
    params.append('description', options.description);
  }

  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

/**
 * Generate Twitter/X share URL
 */
export function getTwitterShareUrl(options: ShareOptions): string {
  const params = new URLSearchParams({
    url: options.url,
  });

  if (options.title) {
    params.append('text', options.title);
  }

  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

/**
 * Generate Instagram share URL
 * Note: Instagram doesn't support direct URL sharing, so we return a copy link
 */
export function getInstagramShareUrl(options: ShareOptions): string {
  // Instagram doesn't support direct URL sharing
  // Return the URL for copying
  return options.url;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Open share dialog
 */
export function openShareDialog(url: string, width: number = 600, height: number = 400): void {
  const left = (window.innerWidth - width) / 2;
  const top = (window.innerHeight - height) / 2;

  window.open(
    url,
    'share',
    `width=${width},height=${height},left=${left},top=${top},toolbar=0,menubar=0,location=0,status=0,scrollbars=1,resizable=1`
  );
}

/**
 * Share to Facebook
 */
export function shareToFacebook(options: ShareOptions): void {
  const url = getFacebookShareUrl(options);
  openShareDialog(url);
}

/**
 * Share to Twitter/X
 */
export function shareToTwitter(options: ShareOptions): void {
  const url = getTwitterShareUrl(options);
  openShareDialog(url);
}

/**
 * Share to Instagram (copy link)
 */
export async function shareToInstagram(options: ShareOptions): Promise<boolean> {
  const url = getInstagramShareUrl(options);
  return await copyToClipboard(url);
}

