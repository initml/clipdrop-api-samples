import { Listbox, Transition } from '@headlessui/react'
import pluralize from 'pluralize'
import { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

interface SelectProps {
  label?: string | ReactNode
  items: Array<{
    value: string
    name: string
  }>
  value: string
  onChange: (value: string) => void
}

export default function Select({ label, value, onChange, items }: SelectProps) {
  console.log(value)
  return (
    <Listbox value={value} onChange={onChange}>
      {({ open }) => (
        <>
          <div className="relative inline items-center">
            {label && (
              <Listbox.Label className="block whitespace-nowrap pr-3 text-sm font-medium leading-5">
                {label}
              </Listbox.Label>
            )}
            <span className="inline-block rounded-md">
              <Listbox.Button
                className={twMerge(
                  'relative w-full cursor-default rounded-2xl',
                  'pb-2 pt-1 pl-3 pr-8 text-left',
                  'border border-gray-300 bg-white bg-opacity-20',
                  'transition duration-150 ease-in-out',
                  'hover:border-gray-400 focus:outline-none',
                  'sm:text-sm sm:leading-5'
                )}
              >
                <span
                  className={twMerge(
                    'text-2xl md:text-4xl',
                    'bg-gradient-to-tr from-cyan-500 to-blue-600 bg-clip-text font-bold text-transparent'
                  )}
                >
                  {items.find((i) => i.value === value)?.name}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M7 7l3-3 3 3m0 6l-3 3-3-3"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Listbox.Button>
              <Transition
                show={open}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                className={twMerge(
                  'absolute z-20 mt-1 min-w-full rounded-2xl',
                  'border border-gray-300 ',
                  'bg-white bg-opacity-50 p-4 shadow-lg backdrop-blur-sm'
                )}
              >
                <Listbox.Options
                  static
                  className="shadow-xs max-h-60 rounded-md py-1 text-base leading-6 focus:outline-none sm:text-sm sm:leading-5"
                >
                  {items.map((item) => (
                    <Listbox.Option key={item.value} value={item.value}>
                      {({ active }) => (
                        <div
                          className={twMerge(
                            active ? '' : 'text-gray-900',
                            'whitespace-nowrap',
                            'relative cursor-default select-none py-2 px-4',
                            'text-left text-xl md:text-3xl',
                            'bg-gradient-to-tr from-black to-black bg-clip-text font-bold text-transparent hover:from-cyan-500 hover:to-blue-600',
                            'cursor-pointer'
                          )}
                        >
                          {item.name}
                        </div>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </span>
          </div>
        </>
      )}
    </Listbox>
  )
}
