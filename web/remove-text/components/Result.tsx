import { useCallback, useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { removeText } from '../remove-text'
import { downloadImage } from '../utils'
import { parse } from 'path'

interface ResultProps {
  apiKey: string
  file: File | undefined
  setFile: (file: File | undefined) => void
  hd: boolean
}

export default function Result({ file, setFile, apiKey, hd }: ResultProps) {
  const [src, setSrc] = useState<string | undefined>(undefined)
  const [processing, setProcessing] = useState(false)

  const reset = useCallback(() => {
    setSrc(undefined)
    setFile(undefined)
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
    removeText(file, apiKey)
      .then(
        (cleanup) => {
          setSrc(cleanup.base64)
          setProcessing(false)
        },
        (e) => {
          throw e
        }
      )
      .catch((e) => {
        console.error('error in result', e)
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
        />

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
          >
            Back
          </button>
          <button
            onClick={() => {
              if (!src) {
                return
              }
              let resultName = 'background.png'
              if (file?.name) {
                const { name } = parse(file.name)
                resultName = `${name}-clipdrop-text-removal.png`
              }

              downloadImage(src, resultName)
            }}
            className={twMerge(
              'h-full rounded-lg px-10 font-semibold text-white',
              'bg-gradient-to-tr from-cyan-500 to-blue-600 hover:bg-gradient-to-l'
            )}
          >
            Download Result
          </button>
        </div>
      </div>
    </div>
  )
}
