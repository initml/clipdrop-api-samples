import React from 'react'

type CellProps = {
  item: Item
  selected: boolean
  onSelectChange: (item: Item, selected: boolean) => void
  onDownload: (item: Item) => void
}

export default function GalleryCell(props: CellProps) {
  const { item, selected, onSelectChange } = props

  return (
    <li className="block p-2 w-1/2 md:w-1/4 lg:w-1/6">
        <article
          tabIndex={0}
          className={`w-full h-full aspect-w-1 aspect-h-1 group rounded-md focus:outline-none relative text-transparent bg-chessboard hover:bg-none cursor-pointer hover:bg-indigo-100 ${
            selected ? 'ring-2 ring-offset-2 ring-indigo-600' : ''
          }`}
          onClick={() => onSelectChange(item, !selected)}
        >
          <img
            alt="upload preview"
            className="object-cover object-center rounded-md"
            src={item.clip?.base64}
            draggable={false}
          />

          <div
            className={`absolute top-2 left-3 group-hover:opacity-100 ${
              selected ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <input
              type="checkbox"
              className="form-checkbox w-4 h-4 rounded-lg cursor-pointer"
              checked={selected}
              onChange={ev => onSelectChange(item, ev.currentTarget.checked)}
            />
          </div>
        </article>
        {/* </div> */}
    </li>
  )
}
