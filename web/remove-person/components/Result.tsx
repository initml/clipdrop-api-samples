import { MouseEventHandler, useCallback, useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { detectPersons, removePerson } from '../remove-person'
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
  const [segmentationProcessing, setSegmentationProcessing] = useState(false)
  const [uxState, setUXState] = useState('ready')

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
    setSegmentationProcessing(true)
    // return
    detectPersons(file)
      .then(
        () => {
          // setSrc(cleanup.base64)
          setSegmentationProcessing(false)
          setUXState('segmented')
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
        setSegmentationProcessing(false)
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
        <div id="result-container">
          <img
            src={src}
            onMouseMove={(e) => {
              const target = e.target as HTMLImageElement
              const rect = target.getBoundingClientRect()
              const tooltip = document.querySelector(
                '#tooltip'
              ) as HTMLDivElement
              const x = e.clientX - rect.left //x position within the element.
              const y = e.clientY - rect.top //y position within the element.
              const container = target.closest('#result-container')
              const canvases = container?.querySelectorAll('canvas')

              if (!canvases) {
                return
              }

              let hasOneCanvasHovered = false
              for (let canvas of Array.from(canvases)) {
                const red = y * (canvas.width * 4) + x * 4
                const ctx = canvas.getContext('2d')
                const imageData = ctx?.getImageData(x, y, 1, 1)
                if (!imageData) {
                  continue
                }
                if (imageData.data[0] !== 0) {
                  canvas.style.opacity = '0.75'
                  hasOneCanvasHovered = true
                } else {
                  canvas.style.opacity = '0.25'
                }
              }

              if (tooltip) {
                if (hasOneCanvasHovered) {
                  tooltip.style.left = `${x + 20}px`
                  tooltip.style.top = `${y + 20}px`
                  tooltip.style.opacity = `1`
                } else {
                  tooltip.style.opacity = `0`
                }
              }
            }}
            onClick={async (e) => {
              try {
                setProcessing(true)
                const target = e.target as HTMLImageElement
                const rect = target.getBoundingClientRect()
                const x = e.clientX - rect.left //x position within the element.
                const y = e.clientY - rect.top //y position within the element.
                const container = target.closest('#result-container')
                const canvases = container?.querySelectorAll('canvas')

                if (!canvases) {
                  return
                }

                for (let canvas of Array.from(canvases)) {
                  const red = y * (canvas.width * 4) + x * 4
                  const ctx = canvas.getContext('2d')
                  const imageData = ctx?.getImageData(x, y, 1, 1)
                  if (!imageData) {
                    continue
                  }
                  if (imageData.data[0] !== 0) {
                    const fullImageData = ctx?.getImageData(
                      0,
                      0,
                      canvas.width,
                      canvas.height
                    )
                    if (!file || !fullImageData) {
                      return
                    }

                    const cleanup = await removePerson(
                      file,
                      fullImageData,
                      apiKey
                    )
                    setSrc(cleanup.base64)
                  }
                }
                Array.from(canvases).map((c) => c.remove())

                setUXState('download')
                setProcessing(false)
              } catch (error) {
                setProcessing(false)
              } finally {
                setProcessing(false)
              }
            }}
            className={twMerge(
              'max-h-[calc(100vh-450px)] rounded-md transition-all duration-700	',
              'border border-opacity-20'
            )}
            alt="Image"
          />
          <div
            id="tooltip"
            role="tooltip"
            className="tooltip absolute z-10 inline-block rounded-lg bg-blue-600 py-2 px-3 text-sm font-medium text-white opacity-0 shadow-sm transition-opacity duration-300 dark:bg-blue-700"
          >
            Click to remove me
          </div>
        </div>

        <div
          className={twMerge(
            'scan absolute top-0 transition-all duration-200',
            'pointer-events-none',
            processing || segmentationProcessing ? '' : 'opacity-0'
          )}
          style={{
            height: '100%',
            width: '100%',
          }}
        ></div>

        {uxState === 'download' ? (
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
        ) : (
          <></>
        )}
      </div>
    </div>
  )
}
