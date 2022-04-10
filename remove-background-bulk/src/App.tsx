import React, { useEffect, useState } from 'react'
import APIKeyInput from './APIKeyInput'
import { clip } from './ClipAPI'
import Gallery from './Gallery'
import Queue from './Queue'
import Upload from './Upload'
import { downloadBlob, sleep } from './utils'

function App() {
  const [queue, setQueue] = useState<Array<Item>>([])
  const [processed, setProcessed] = useState<Array<Item>>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [apiKey, setAPIKey] = useState<string>(
    localStorage.getItem('apiKey') || ''
  )

  // Use effect to process the queue
  useEffect(() => {
    const process = async () => {
      if (!isProcessing) {
        return
      }

      // An item is already processing
      if (queue.some(it => it.status === 'processing')) {
        return
      }

      // Get next queued item
      const index = queue.findIndex(it => it.status === 'queued')

      // No more queued item
      if (index === -1) {
        setIsProcessing(false)
        return
      }

      // Update the queue with the item processing status
      const newQueue = queue.slice()
      const item = newQueue[index]
      item.status = 'processing'
      setQueue(newQueue)

      try {
        // Clip the item
        item.clip = await clip(item, apiKey)
        item.status = 'done'

        // Add the item to the list of processed items
        processed.unshift(item)
        setProcessed(processed.slice())

        // Remove the item from the queue
        newQueue.splice(index, 1)
        setQueue(newQueue)
      } catch (e: any) {
        // Update the queue with the item error status
        item.status = `error: ${e.message}`
        setQueue(newQueue)
      }
    }
    process()
  }, [isProcessing, queue, processed, setQueue, apiKey])

  function addFiles(files: FileList | Array<File>) {
    const newItems = queue.slice()
    Array.from(files).forEach(file => {
      // Skip non-image or csv files
      const isImage = file.type.match('image.*')
      if (!isImage) {
        return
      }

      const item: Item = {
        id: `${file.name}-${Date.now()}`,
        name: file.name,
        file: file,
        status: '',
        size:
          file.size > 1024
            ? file.size > 1048576
              ? Math.round(file.size / 1048576) + 'mb'
              : Math.round(file.size / 1024) + 'kb'
            : file.size + 'b',
      }
      try {
        // Check if file is larger than 10mb
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('file too large')
        }
        item.image = URL.createObjectURL(file)
        item.status = 'queued'
      } catch (e: any) {
        item.status = `error: ${e.message}`
      }

      newItems.push(item)
    })
    setQueue(newItems)
  }

  function onDelete(itemsToDelete: Item | Array<Item>) {
    if (!Array.isArray(itemsToDelete)) {
      itemsToDelete = [itemsToDelete]
    }
    // Optimization in case of "delete all"
    if (itemsToDelete.length === queue.length) {
      setQueue([])
    }
    // Otherwise delete 1 by 1
    const newQueue = queue.slice()
    itemsToDelete.forEach(item => {
      const ix = newQueue.findIndex(it => it.id === item.id)
      newQueue.splice(ix, 1)
    })
    setQueue(newQueue)
  }

  async function onProcess() {
    setIsProcessing(true)
  }

  function onStop() {
    setIsProcessing(false)
  }

  async function onDownload(items: Item | Array<Item>) {
    if (!Array.isArray(items)) {
      items = [items]
    }
    for (const it of items) {
      if (!it.clip) {
        continue
      }
      const name = it.name.slice(0, it.name.lastIndexOf('.')) + '.clip.png'
      downloadBlob(it.clip?.base64, name)
      await sleep(100)
    }
  }

  return (
    <div className="w-full flex flex-col items-center mx-auto px-5">
      <div className="container flex flex-col pt-10 w-full max-w-5xl space-y-12">
        <h1 className="text-2xl font-bold">
          ClipDrop API - Bulk Remove Background
        </h1>
        <APIKeyInput
          value={apiKey}
          onChange={(value: string) => {
            setAPIKey(value)
            localStorage.setItem('apiKey', value)
          }}
        />
        <div
          className={[
            apiKey ? '' : 'opacity-50 pointer-events-none',
            'space-y-12',
          ].join(' ')}
        >
          <Upload onSelection={addFiles} />

          {queue.length ? (
            <Queue
              items={queue}
              onDelete={onDelete}
              onProcess={onProcess}
              onStop={onStop}
              isProcessing={isProcessing}
            />
          ) : (
            <></>
          )}

          {processed.length ? (
            <Gallery items={processed} onDownload={onDownload} />
          ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
