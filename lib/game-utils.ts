export function extractGameId(url: string): string | null {
  const match = url.match(/id=([a-zA-Z0-9\-_]+)/)
  return match ? match[1] : null
}

export function buildEmbedUrl(id: string): string {
  return `https://arcade.makecode.com/---run?id=${id}`
}

export function isValidMakeCodeUrl(url: string): boolean {
  return /^https?:\/\/arcade\.makecode\.com\/.*id=[a-zA-Z0-9\-_]+/.test(url)
}
