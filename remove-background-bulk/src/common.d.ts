type Clip = {
  id: string
  base64: string
}

type Item = {
  id: string
  name: string
  status: string
  image?: string
  size?: string
  file: File
  clip?: Clip
}