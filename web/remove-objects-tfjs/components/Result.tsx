import pluralize from 'pluralize'
import { useCallback, useEffect, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import inpainting from '../inpaint'
import cocossd, { CocoSSDResult } from '../inpaint/cocossd'
import { blobToCanvas, downloadImage } from '../inpaint/utils'

interface ResultProps {
  apiKey: string
  file: File | undefined
  setFile: (file: File | undefined) => void
  setDetectedClasses: (classes?: string[]) => void
  classToShow?: string
  hd: boolean
}

export default function Result({
  file,
  setFile,
  apiKey,
  hd,
  setDetectedClasses,
  classToShow,
}: ResultProps) {
  const [src, setSrc] = useState<string | undefined>(undefined)
  const [foregroundSrc, setForegroundSrc] = useState<string | undefined>()
  const [processing, setProcessing] = useState(false)

  const [original, setOriginal] = useState<HTMLCanvasElement>()
  const [detectedObjects, setDetectedObjects] = useState<CocoSSDResult[]>()
  const [isForegroundLoaded, setIsForegroundLoaded] = useState(false)
  const ref = useRef(null)

  const reset = useCallback(() => {
    setSrc(undefined)
    setForegroundSrc(undefined)
    setFile(undefined)
    setIsForegroundLoaded(false)
    setDetectedClasses(undefined)
  }, [])

  const process = useCallback(async (file) => {
    try {
      const image = await blobToCanvas(file)
      const results = await cocossd(image)
      if (!results.length) {
        throw new Error('No objects detected')
      }
      return { image, results }
    } catch (e: any) {
      console.error(e)
      alert(e.Error || e.message)
      reset()
      return { image: undefined, results: undefined }
    }
  }, [])

  // Process the file when set
  useEffect(() => {
    if (!file) {
      return
    }
    const newSrc = URL.createObjectURL(file)
    setSrc(newSrc)
    process(file).then(({ image, results }) => {
      setOriginal(image)
      setDetectedObjects(
        results?.map((r) => ({ ...r, class: pluralize(r.class) }))
      )

      const detectedClasses = Array.from(
        new Set(results?.map((r) => pluralize(r.class)))
      )
      setDetectedClasses(detectedClasses)
    })
  }, [file])

  // Process inpainting when the class changes
  useEffect(() => {
    if (!classToShow) {
      return
    }
    const data = detectedObjects?.find((r) => r.class === classToShow)
    if (!original || !data?.mask) {
      return
    }
    setProcessing(true)
    setIsForegroundLoaded(false)
    inpainting(original, data?.mask, apiKey, hd)
      .then((result) => {
        setSrc(result.toDataURL())
        setForegroundSrc(data.foreground.toDataURL())
        setProcessing(false)
      })
      .catch((e) => {
        console.error(e)
        alert(e.error || e.message || e)
        reset()
      })
      .finally(() => {
        setProcessing(false)
      })
  }, [classToShow])

  return (
    <div className="flex max-w-[850px] flex-col gap-5">
      <div className={twMerge('relative transition-all duration-700')}>
        <img
          src={src}
          className={twMerge(
            'max-h-[calc(100vh-450px)] rounded-md transition-all duration-700'
          )}
          alt="Image"
        />
        {foregroundSrc && (
          <img
            ref={ref}
            src={foregroundSrc}
            className={twMerge(
              'absolute top-0',
              'max-h-[calc(100vh-450px)] rounded-md transition-all duration-700',
              isForegroundLoaded ? 'opacity-0' : 'opacity-100'
            )}
            alt="Image"
            onLoad={() => {
              setIsForegroundLoaded(true)
            }}
          />
        )}

        <div
          className={twMerge(
            'scan transition-all duration-200',
            'pointer-events-none',
            processing ? '' : 'opacity-0'
          )}
          style={{
            height: '100%',
            width: '100%',
          }}
        ></div>

        <div
          className={twMerge(
            'flex h-20 justify-center space-x-4 pt-8 transition-opacity delay-700 duration-200',
            processing ? 'pointer-events-none opacity-20' : ''
          )}
        >
          <button
            onClick={reset}
            className={twMerge('h-full rounded-lg px-10 font-semibold border hover:border-blue-500')}
          >
            Back
          </button>
          <button
            onClick={() => {
              if (!src) {
                return
              }
              downloadImage(src, 'result.png')
            }}
            className={twMerge(
              'h-full rounded-lg px-10 font-semibold text-white',
              'bg-gradient-to-tr from-cyan-500 to-blue-600 hover:bg-gradient-to-l'
            )}
          >
            Download
          </button>
        </div>
      </div>
    </div>
  )
}
