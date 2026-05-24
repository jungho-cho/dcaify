export function readingMinutes(content: string, lang: string): number {
  if (!content) return 1
  if (lang === 'ko') {
    const chars = content.replace(/\s/g, '').length
    return Math.max(1, Math.round(chars / 500))
  }
  const words = content.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}
