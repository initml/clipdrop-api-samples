export default function APIKeyInput(props: any) {
  const { onChange, value } = props

  return (
    <div className="flex flex-row justify-center items-center space-x-3 mt-6">
      <span className="whitespace-nowrap font-semibold text-sm opacity-70">
        API Key
      </span>
      <input
        id="apikey"
        name="apikey"
        autoComplete="API Key"
        type="password"
        required
        className="appearance-none relative block w-full my-4 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
        placeholder="Paste your ClipDrop API Key here to get started"
        value={value}
        onChange={ev => onChange(ev.currentTarget.value)}
      />
    </div>
  )
}
