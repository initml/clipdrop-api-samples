import { useCallback, useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import decompose from '../decompose'
import { downloadImage } from '../decompose/utils'

interface ResultProps {
  apiKey: string
  file: File | undefined
  setFile: (file: File | undefined) => void
  hd: boolean
}

export default function Result({ file, setFile, apiKey, hd }: ResultProps) {
  const [src, setSrc] = useState<string | undefined>(undefined)
  const [foregroundSrc, setForegroundSrc] = useState<string | undefined>()
  const [revealed, setRevealed] = useState(false)
  const [processing, setProcessing] = useState(false)

  const reset = useCallback(() => {
    setSrc(undefined)
    setForegroundSrc(undefined)
    setFile(undefined)
    setRevealed(false)
  }, [])

  // Process the image when set
  useEffect(() => {
    if (!file) {
      return
    }
    const newSrc = URL.createObjectURL(file)
    setSrc(newSrc)
    setProcessing(true)
    // return
    decompose(file, apiKey, hd)
      .then(({ background, foreground }) => {
        setSrc(background.toDataURL())
        setForegroundSrc(foreground.toDataURL())
        setProcessing(false)
        setTimeout(() => {
          setRevealed(true)
        }, 200)
      })
      .catch((e) => {
        console.log(e)
        alert(e.error || e.message)
        reset()
      })
      .finally(() => {
        setProcessing(false)
      })
  }, [file])

  return (
    <div className="flex max-w-[850px] flex-col gap-5">
      <div
        className={twMerge(
          'relative transition-all duration-700',
          processing ? 'translate-y-20' : ''
        )}
      >
        <img
          src={src}
          className={twMerge(
            'max-h-[calc(100vh-450px)] rounded-md transition-all duration-700',
            'border border-opacity-20'
          )}
          alt="Image"
          style={{
            transform: revealed
              ? 'translateX(-100px) rotate3d(1, -1, -0.3, 45deg)'
              : '',
          }}
        />
        {foregroundSrc && (
          <img
            src={foregroundSrc}
            className={twMerge(
              'absolute top-0',
              'max-h-[calc(100vh-450px)] rounded-md transition-all duration-700',
              'border border-opacity-30',
              revealed ? 'bg-gray-200 bg-opacity-20 hover:backdrop-blur-sm' : ''
            )}
            alt="Image"
            style={{
              transform: revealed
                ? 'translateX(100px) rotate3d(1, -1, -0.3, 45deg)'
                : '',
            }}
          />
        )}

        <div
          className={twMerge(
            'scan absolute top-0 transition-all duration-200',
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
            'flex h-36 justify-center space-x-4 pt-20 transition-opacity delay-700 duration-200',
            processing ? 'pointer-events-none opacity-0' : ''
          )}
        >
          <button
            onClick={reset}
            className={twMerge(
              'h-full rounded-lg px-10 font-semibold text-black',
              'border border-black border-opacity-20 hover:bg-gray-100'
            )}
            onMouseOver={() => {
              if (!processing) setRevealed(false)
            }}
            onMouseLeave={() => {
              if (!processing) setRevealed(true)
            }}
          >
            Back
          </button>
          <button
            onClick={() => {
              if (!src || !foregroundSrc) {
                return
              }
              downloadImage(src, 'background.png')
              downloadImage(foregroundSrc, 'foreground.png')
            }}
            className={twMerge(
              'h-full rounded-lg px-10 font-semibold text-white',
              'bg-gradient-to-tr from-cyan-500 to-blue-600 hover:bg-gradient-to-l'
            )}
          >
            Download Layers
          </button>
        </div>
      </div>
    </div>
  )
}
