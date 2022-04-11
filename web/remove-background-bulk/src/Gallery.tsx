import { DownloadIcon } from '@heroicons/react/outline'
import React, { useCallback, useEffect, useState } from 'react'
import { Button } from './Components'
import GalleryCell from './GalleryCell'
import Pagination from './Pagination'
import { getBreakpoint } from './utils'

type GalleryProps = {
  items: Array<Item>
  onDownload: (it: Item | Array<Item>) => void
}

export default function Queue(props: GalleryProps) {
  const { items, onDownload } = props

  const sel: Record<string, boolean> = {}
  items.forEach(it => (sel[it.id] = false))
  const [selection, setSelection] = useState(sel)

  const getNumItemsPerPage = useCallback(() => {
    switch (getBreakpoint(window.innerWidth)) {
      case 'lg':
      case 'xl':
        return 30
      case 'md':
        return 16
      case 'sm':
      default:
        return 8
    }
  }, [])
  const [numItemsPerPage, setNumItemsPerPage] = useState(getNumItemsPerPage())

  useEffect(() => {
    const handler = () => {
      setNumItemsPerPage(getNumItemsPerPage())
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [getNumItemsPerPage])

  const [page, setPage] = useState(0)

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

  if (!items.length) {
    return <></>
  }

  return (
    <div className="flex flex-col pb-8">
      <div className="sm:-mx-6 lg:-mx-8">
        <div className="align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="flex items-center py-3 px-6 bg-gray-50 rounded-lg h-20  border border-gray-200">
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

            {getSelectedItems().length ? (
              <>
                <span className="text-gray-500 text-sm mr-6 hidden sm:inline">
                  {getSelectedItems().length} images selected
                </span>

                <Button
                  icon={<DownloadIcon className="h-6 w-6" />}
                  onClick={() => onDownload(getSelectedItems())}
                  label={`Download ${getSelectedItems().length} images`}
                />
              </>
            ) : (
              <>
                <span className="text-gray-500 text-sm mr-6 hidden sm:inline">
                  {items.length} image processed successfully
                </span>
                <Button
                  icon={<DownloadIcon className="h-6 w-6" />}
                  onClick={() => onDownload(items)}
                  label={`Download all`}
                />
              </>
            )}
          </div>

          <ul className="flex flex-1 flex-wrap -m-1 my-2">
            {items
              .slice(page * numItemsPerPage, (page + 1) * numItemsPerPage)
              .map(item => (
                <GalleryCell
                  key={item.id}
                  item={item}
                  selected={selection[item.id] || false}
                  onSelectChange={onRowSelectChange}
                  onDownload={onDownload}
                />
              ))}
          </ul>

          {items.length > numItemsPerPage && (
            <div className="rounded-lg border">
              {/* <div className="border rounded-lg border-gray-200"> */}
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
  )
}
