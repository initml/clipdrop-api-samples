import { useCallback, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import DropZone from '../components/DropZone'

const ALLOWED_FILES = ['image/png', 'image/jpeg']

interface LandingProps {
  file: File | undefined
  setFile: (file: File | undefined) => void
}

export default function Landing({ file, setFile }: LandingProps) {
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
  }, [setFile])

  const [dragging, setDragging] = useState(false)
  const handleDragging = useCallback((dragging: boolean) => {
    setDragging(dragging)
  }, [])

  return (
    <div className="px-2">
      <h1 className="flex flex-col items-center space-y-8 text-6xl font-bold">
        <span>
          <span className="bg-gradient-to-tr from-cyan-500 to-blue-600 bg-clip-text text-transparent">
            Create your profile picture
          </span>
          <br />
          automatically
        </span>
      </h1>
    </div>
  )
}
