import { TrashIcon } from '@heroicons/react/outline'
import React from 'react'
import { IconButton } from './Components'
import { classNames } from './utils'

function Tag(props: any) {
  const { type, text } = props
  let style: string
  switch (type) {
    case 'error':
      style = 'bg-red-400 text-white'
      break
    case 'processing':
      style = 'bg-indigo-500 text-white animate-pulse-fast'
      break
    default:
      style = 'bg-gray-100 text-gray-700'
  }
  return (
    <span
      className={`px-4 py-1 inline-flex text-sm leading-5 font-medium rounded-full bg-red  ${style}`}
    >
      {text}
    </span>
  )
}

type RowProps = {
  item: Item
  selected: boolean
  onSelectChange: (item: Item, selected: boolean) => void
  onDelete: (item: Item) => void
  // onDownload?: (item: Item) => void
}

export default function QueueRow(props: RowProps) {
  const {
    item,
    selected,
    onSelectChange,
    onDelete,
    // onDownload
  } = props

  return (
    <tr
      className={classNames(
        'group hover:bg-gray-50 align-middle',
        item.status === 'processing' ? 'pointer-events-none' : ''
      )}
    >
      <td className="px-6 py-4 w-14">
        <input
          type="checkbox"
          className="form-checkbox"
          checked={selected}
          onChange={ev => onSelectChange(item, ev.currentTarget.checked)}
        />
      </td>
      <td className="w-20 py-2 whitespace-nowrap sm:pl-6 ">
        <div className="flex justify-center rounded-md flex-shrink-0 w-12 h-12">
          <img className="h-12 rounded-md" src={item.image} alt="" />
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell align-middle">
        <div className="ml-4 h-full">
          <div className="text-sm text-gray-700 font-medium">{item.name}</div>
          <div className="text-xs text-gray-500 ">{item.size}</div>
        </div>
      </td>
      <td className="px-4 whitespace-nowrap text-right">
        <div className="flex flex-row items-center justify-end mr-4">
          <div>
            <Tag type={item.status.split(':')[0]} text={item.status} />
          </div>
          <div className="pl-2 flex-row hidden group-hover:flex">
            <IconButton
              onClick={() => onDelete(item)}
              icon={<TrashIcon className="w-6 h-6" />}
            />
          </div>
        </div>
      </td>
    </tr>
  )
}
