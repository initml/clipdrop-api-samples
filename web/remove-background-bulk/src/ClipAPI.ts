import { sleep } from './utils'

const IS_PROD = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
const MOCK_API_CALL = IS_PROD && false

const CLIP_API_ENDPOINT = `https://clipdrop-api.co/remove-background/v1`

export async function clip(item: Item, apiKey: string): Promise<Clip> {
  if (MOCK_API_CALL) {
    await sleep(1000)
    return { id: '', base64: item.image || '' }
    // throw new Error('test')
  }
  // Send to service
  const fd = new FormData()
  fd.append('image_file', item.file)

  let response
  try {
    const headers: Record<string, string> = {
      'user-agent': 'ClipDrop-BatchProcess',
    }
    headers['x-api-key'] = apiKey
    response = await fetch(CLIP_API_ENDPOINT, {
      method: 'POST',
      headers,
      body: fd,
    })
    if (response.status && response.status > 400) {
      const text = await response.text()
      throw new Error(response.status + ' ' + text)
    }

    console.log(response.headers)

    const blob = await response.blob()
    const base64 = await URL.createObjectURL(blob)

    return {
      id: '',
      base64,
    }
  } catch (e) {
    throw e
  }
}
