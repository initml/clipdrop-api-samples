import { Switch } from '@headlessui/react'
import { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

interface ToggleProps {
  label: string | ReactNode
  enabled: boolean
  setEnabled: (enabled: boolean) => void
}

export default function Toggle(props: ToggleProps) {
  const { enabled, label, setEnabled } = props

  return (
    <Switch.Group>
      <div className="inline-flex items-center drop-shadow-lg">
        <Switch.Label className="mr-4 font-bold opacity-70">
          {label}
        </Switch.Label>
        <Switch
          checked={enabled}
          onChange={setEnabled}
          className={twMerge(
            enabled
              ? 'bg-blue-600'
              : 'border border-white border-opacity-30 bg-white bg-opacity-40 backdrop-blur-lg',
            'relative inline-flex h-7 w-12 items-center rounded-full'
          )}
        >
          <span
            className={twMerge(
              'transform transition duration-200 ease-in-out',
              enabled ? 'translate-x-6 bg-white' : 'translate-x-1 bg-black',
              'inline-block h-5 w-5 transform  rounded-full'
            )}
          />
        </Switch>
      </div>
    </Switch.Group>
  )
}
