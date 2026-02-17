/**
 * Validates whether a string is a properly-formed URL.
 * Accepts http and https schemes only.
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Sanitizes a title string to prevent XSS.
 * Strips HTML tags and trims whitespace.
 */
export function sanitizeTitle(title: string): string {
  return title
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
    .slice(0, 200) // max 200 chars
}

/**
 * Normalises a URL — adds https:// if no scheme is provided.
 */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`
  }
  return trimmed
}

/**
 * Derives favicon URL from a website URL using Google's favicon service.
 */
export function getFaviconUrl(url: string): string {
  try {
    const parsed = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`
  } catch {
    return ''
  }
}
