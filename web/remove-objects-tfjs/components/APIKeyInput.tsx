import { twMerge } from 'tailwind-merge'

export default function APIKeyInput(props: any) {
  const { onChange, value } = props

  return (
    <div className="flex flex-row items-center justify-center space-x-3">
      <span className="whitespace-nowrap font-bold opacity-70">API Key</span>
      <input
        id="apikey"
        name="apikey"
        autoComplete="API Key"
        type="password"
        required
        className="relative my-4 block w-full appearance-none rounded-md border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        placeholder="Your ClipDrop API Key"
        value={value}
        onChange={(ev) => onChange(ev.currentTarget.value)}
      />
      {!value && (
        <a
          href="https://clipdrop.co/apis?utm_source=api-sample&utm_medium=decompose-layers"
          target="_blank"
          rel="noopener noreferrer"
          className={twMerge(
            'whitespace-nowrap rounded-lg py-3 px-4 font-semibold text-white',
            'bg-gradient-to-tr from-cyan-500 to-blue-600 hover:bg-gradient-to-l'
          )}
        >
          Get an API Key
        </a>
      )}
    </div>
  )
}
