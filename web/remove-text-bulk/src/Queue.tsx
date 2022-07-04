import { ArrowCircleRightIcon, TrashIcon } from '@heroicons/react/outline'
import React, { useEffect, useState } from 'react'
import { Button } from './Components'
import Pagination from './Pagination'
import QueueRow from './QueueRow'

type GalleryProps = {
  items: Array<Item>
  onDelete: (it: Item | Array<Item>) => void
  onProcess: () => void
  onStop: () => void
  isProcessing: boolean
}

export default function Queue(props: GalleryProps) {
  const { items, onDelete, onProcess, isProcessing, onStop } = props

  const numItemsPerPage = 5
  const [page, setPage] = useState(0)

  useEffect(() => {
    setPage(0)
  }, [isProcessing])

  const sel: Record<string, boolean> = {}
  items.forEach(it => (sel[it.id] = false))
  const [selection, setSelection] = useState(sel)

  const getSelectedItems = () => items.filter(it => selection[it.id])

  function onRowSelectChange(item: Item, selected: boolean) {
    const sel = { ...selection }
    sel[item.id] = selected
    setSelection(sel)
  }

  function toggleSelectAll(selectAll: boolean) {
    const sel = { ...selection }
    items.forEach(it => (sel[it.id] = selectAll))
    setSelection(sel)
  }

  function getAction() {
    const selectedItems = getSelectedItems()
    if (selectedItems.length) {
      return (
        <>
          <span className="text-gray-500 text-sm mr-6 hidden sm:inline">
            {selectedItems.length} items selected
          </span>
          <Button
            icon={<TrashIcon className="w-6 h-6" />}
            onClick={() => onDelete(selectedItems)}
            label={`Remove ${selectedItems.length} files`}
          />
        </>
      )
    }

    const validItems = items.filter(it => it.status === 'queued')

    if (isProcessing) {
      return (
        <>
          <span className="text-sm text-gray-700 animate-pulse mr-6">
            Processing {validItems.length + 1} items...
          </span>
          <Button
            // icon={<StopIcon className="w-6 h-6" />}
            onClick={() => onStop()}
            label={`Stop`}
          />
        </>
      )
    }

    if (validItems.length) {
      return (
        <Button
          icon={<ArrowCircleRightIcon className="w-6 h-6" />}
          onClick={onProcess}
          variant="primary"
          label={`Process ${validItems.length} files`}
        />
      )
    }

    return <></>
  }

  if (!items.length) {
    return <></>
  }

  return (
    <div className="flex flex-col">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            {/* Header */}
            <div className="flex items-center py-3 px-6 rounded-t-md border border-gray-200 bg-gray-50">
              <div className="flex-grow">
                <label>
                  <input
                    type="checkbox"
                    onChange={ev => toggleSelectAll(ev.currentTarget.checked)}
                    className="form-checkbox"
                  />
                  <span className="font-medium text-sm text-gray-700 ml-2 select-none">
                    Select All
                  </span>
                </label>
              </div>

              {getAction()}
            </div>

            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="bg-white divide-y divide-gray-200">
                {items
                  .slice(page * numItemsPerPage, (page + 1) * numItemsPerPage)
                  .map(item => (
                    <QueueRow
                      key={item.id}
                      item={item}
                      selected={selection[item.id] || false}
                      onSelectChange={onRowSelectChange}
                      onDelete={onDelete}
                    />
                  ))}
              </tbody>
            </table>
            {items.length > numItemsPerPage && (
              <div className="border-t border-gray-200">
                <Pagination
                  page={page}
                  numPerPage={numItemsPerPage}
                  total={items.length}
                  onPageChange={p => setPage(p)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
