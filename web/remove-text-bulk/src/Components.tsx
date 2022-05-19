import { classNames } from './utils'

export function IconButton(props: any) {
  const { icon, onClick, color } = props
  return (
    <button
      onClick={onClick}
      className={`${
        color || 'text-gray-400 hover:text-gray-600'
      } sm:flex sm:items-center sm:justify-center relative w-9 h-9 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 group`}
    >
      {icon}
    </button>
  )
}

export function Button(props: any) {
  const { icon, label, onClick, variant } = props
  let color = 'bg-white  border-gray-300  text-gray-700 hover:bg-gray-50'
  if (variant === 'primary') {
    color = 'bg-indigo-600  border-indigo-300 text-white hover:bg-indigo-500'
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-row items-center py-2 px-5 h-12 border space-x-4 rounded-md shadow-sm text-sm leading-4 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${color}`}
    >
      {icon}
      <span className={classNames(icon ? 'ml-2' : '', 'whitespace-nowrap')}>
        {label}
      </span>
    </button>
  )
}
