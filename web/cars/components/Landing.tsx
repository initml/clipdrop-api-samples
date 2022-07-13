import { useCallback, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import DropZone from '../components/DropZone'

const ALLOWED_FILES = ['image/png', 'image/jpeg']

interface LandingProps {
  file: File | undefined
  setFile: (file: File | undefined) => void
  apiKey: string | undefined
}

export default function Landing({ file, setFile, apiKey }: LandingProps) {
  const inputFileRef = useRef<HTMLInputElement | null>(null)

  const handleFilesSelected = useCallback((files: FileList | Array<File>) => {
    const file = Array.from(files).filter((file) =>
      ALLOWED_FILES.includes(file.type)
    )[0]

    if (file) {
      setFile(file)
    }
    if (inputFileRef.current) {
      inputFileRef.current.value = ''
    }
  }, [])

  const [dragging, setDragging] = useState(false)
  const handleDragging = useCallback((dragging: boolean) => {
    setDragging(dragging)
  }, [])

  return (
    <div className="px-2">
      <h1 className="flex flex-col items-center space-y-8 text-6xl font-bold">
        <span>
          <span className="bg-gradient-to-tr from-cyan-500 to-blue-600 bg-clip-text text-transparent">
          Edit your car images
          </span>
          <br />
          automatically
        </span>
      </h1>

      <div
        className={twMerge(
          'mt-16',
          'w-full overflow-hidden rounded-3xl',
          'border-4 border-dashed border-black',
          !apiKey ? 'pointer-events-none opacity-10' : ''
        )}
      >
        <DropZone
          onDrop={(files) => handleFilesSelected(files)}
          onDrag={handleDragging}
        >
          <div
            className={twMerge(
              'flex',
              'flex-col items-center justify-center',
              'px-8 py-8 text-center sm:py-16',
              'cursor-pointer',
              'hover:bg-gray-100',
              dragging ? 'opacity-50' : ''
            )}
            onClick={() => inputFileRef.current?.click()}
          >
            <p className="mx-16 text-center font-bold opacity-100">
              {apiKey
                ? 'Drag & drop an image or click here to select'
                : 'Set your ClipDrop API key to get started'}
            </p>
            <input
              type="file"
              ref={inputFileRef}
              className={twMerge(
                'absolute top-0 bottom-0 left-0 right-0',
                'hidden'
              )}
              accept={ALLOWED_FILES.join(',')}
              onChange={(ev) =>
                handleFilesSelected(ev.currentTarget.files ?? [])
              }
            />
          </div>
        </DropZone>
      </div>
    </div>
  )
}
