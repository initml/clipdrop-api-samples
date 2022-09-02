import * as React from 'react'
import { useRef } from 'react'

import mergeClass from './mergeClass'

type Props = React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> & {
  disableDefaultClick?: boolean
  height?: string
  width?: string
  text?: {
    off: React.ReactNode
    on: React.ReactNode
  }
}

export default function Switch({
  text,
  disableDefaultClick,
  height = 'h-8',
  width = 'w-[8rem]',
  ...props
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  function handleClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    if (disableDefaultClick) return
    if (inputRef.current) {
      if (inputRef.current !== e.target) {
        inputRef.current.click()
      }
    }
  }

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div className="relative cursor-pointer" onClick={handleClick}>
      <input
        ref={inputRef}
        type="checkbox"
        id="toggleB"
        className="peer sr-only"
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
      />
      <div
        className={mergeClass(
          'block  rounded-full',
          text ? width : 'w-14',
          height,
          'bg-black text-white dark:bg-gray-600',
          'peer-checked:bg-black dark:peer-checked:bg-gray-600',
          'transition-colors',
        )}
      />
      <div
        className={mergeClass(
          'absolute top-1 rounded-full',
          text ? `top-0 left-[-1px] w-1/2 ${height}` : 'top-1 left-1 w-6 h-6',
          'bg-gray-200 dark:bg-white',
          text
            ? 'peer-checked:bg-gray-200 dark:peer-checked:bg-white'
            : 'peer-checked:bg-primary-400',
          text
            ? 'peer-checked:translate-x-[calc(100%+2px)]'
            : 'peer-checked:translate-x-full',
          'transition',
        )}
      />
      {text && (
        <>
          <div
            className={mergeClass(
              'absolute top-0 left-0.5 h-full w-1/2',
              'text-xs font-semibold select-none',
              'text-dark peer-checked:text-white dark:text-black peer-checked:dark:text-black',
              'transition-colors',
              'flex items-center justify-center',
            )}
          >
            {text.off}
          </div>
          <div
            className={mergeClass(
              'absolute top-0 right-0 h-full w-1/2',
              'text-xs font-semibold select-none',
              'text-white dark:text-black peer-checked:dark:text-black peer-checked:text-black',
              'transition-colors',
              'flex items-center justify-center',
            )}
          >
            {text.on}
          </div>
        </>
      )}
    </div>
  )
}