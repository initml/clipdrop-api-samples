import React, { useState } from 'react'

type UploadProps = {
  onSelection: (files: FileList | Array<File>) => void
  disabled?: boolean
}

export default function Upload(props: UploadProps) {
  const { onSelection } = props

  const [dragHover, setDragHover] = useState(false)

  function onFilesSelected(files: FileList | Array<File> | null) {
    if (files) {
      onSelection(files)
    }
  }

  async function getFile(entry: any): Promise<File> {
    return new Promise(resolve => {
      entry.file((file: File) => resolve(file))
    })
  }

  // Drop handler function to get all files
  async function getAllFileEntries(items: DataTransferItemList) {
    let fileEntries: Array<File> = []
    // Use BFS to traverse entire directory/file structure
    let queue = []
    // Unfortunately items is not iterable i.e. no forEach
    for (let i = 0; i < items.length; i++) {
      queue.push(items[i].webkitGetAsEntry())
    }
    while (queue.length > 0) {
      let entry = queue.shift()
      if (!entry) {
        continue
      }
      if (entry.isFile) {
        // Only append images
        const file = await getFile(entry)
        fileEntries.push(file)
      } else if (entry.isDirectory) {
        // @ts-ignore
        queue.push(...(await readAllDirectoryEntries(entry.createReader())))
      }
    }
    return fileEntries
  }

  // Get all the entries (files or sub-directories) in a directory
  // by calling readEntries until it returns empty array
  async function readAllDirectoryEntries(directoryReader: any) {
    let entries = []
    let readEntries = await readEntriesPromise(directoryReader)
    while (readEntries.length > 0) {
      entries.push(...readEntries)
      readEntries = await readEntriesPromise(directoryReader)
    }
    return entries
  }

  // Wrap readEntries in a promise to make working with readEntries easier
  // readEntries will return only some of the entries in a directory
  // e.g. Chrome returns at most 100 entries at a time
  async function readEntriesPromise(directoryReader: any): Promise<any> {
    try {
      return await new Promise((resolve, reject) => {
        directoryReader.readEntries(resolve, reject)
      })
    } catch (err) {
      console.log(err)
    }
  }

  async function handleDrop(ev: React.DragEvent) {
    ev.preventDefault()
    let items = await getAllFileEntries(ev.dataTransfer.items)
    onFilesSelected(items)
    setDragHover(false)
  }

  return (
    <label
      htmlFor="file-upload"
      className="group relative cursor-pointer bg-white rounded-md font-medium focus-within:outline-none"
    >
      <div
        className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md hover:border-indigo-600 hover:bg-indigo-50 ${
          dragHover ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'
        }`}
        onDrop={handleDrop}
        onDragOver={ev => {
          ev.stopPropagation()
          ev.preventDefault()
          setDragHover(true)
        }}
        onDragLeave={() => setDragHover(false)}
      >
        <div className="space-y-1 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 group-hover:text-indigo-500"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {/* <PhotographIcon className="mx-auto h-12 w-12 text-gray-400 group-hover:text-indigo-500"/> */}
          <div className="flex text-sm text-gray-600">
            <span className="text-indigo-600 hover:text-indigo-500">
              Click here
            </span>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              className="sr-only"
              onClick={ev => (ev.currentTarget.value = '')}
              onChange={ev => onFilesSelected(ev.currentTarget.files)}
              multiple
            />
            <p className="pl-1"> or drag image files</p>
          </div>
          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
        </div>
      </div>
    </label>
  )
}
