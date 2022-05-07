import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import APIKeyInput from '../components/APIKeyInput'
import Landing from '../components/Landing'
import Result from '../components/Result'
import Toggle from '../components/Toggle'

const Home: NextPage = () => {
  const [file, setFile] = useState<File | undefined>()
  const [apiKey, setAPIKey] = useState<string>('')
  const [hd, setHD] = useState(false)

  useEffect(() => {
    const key = localStorage.getItem('apiKey') || ''
    setAPIKey(key)
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Head>
        <title>ClipDrop API - Layer Decomposition Sample</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="flex w-full justify-between border-b border-black border-opacity-10 px-4 pl-8">
        <div className="flex items-center space-x-4">
          <h1 className="bg-gradient-to-tr from-cyan-500 to-blue-600 bg-clip-text text-xl font-bold text-transparent">
            <a
              href="https://clipdrop.co/apis?utm_source=api-sample&utm_medium=decompose-layers"
              target="_blank"
              rel="noopener noreferrer"
            >
              ClipDrop API
            </a>
          </h1>
          <p className="hidden text-lg font-semibold text-gray-400 sm:block">
            Layer Decomposition Sample
          </p>
        </div>
        <div className="flex items-center space-x-12">
          <Toggle label="HD" enabled={hd} setEnabled={setHD} />
          <APIKeyInput
            value={apiKey}
            onChange={(value: string) => {
              setAPIKey(value)
              localStorage.setItem('apiKey', value)
            }}
          />
        </div>
      </header>

      <main className="flex w-full flex-1 flex-col items-center justify-center text-center">
        {file && apiKey ? (
          <Result file={file} setFile={setFile} apiKey={apiKey} hd={hd} />
        ) : (
          <Landing file={file} setFile={setFile} apiKey={apiKey} />
        )}
      </main>

      <footer className="mt-4 flex h-24 w-full items-center justify-center space-x-12 border-t">
        <a
          className="flex items-center justify-center gap-2"
          href="https://clipdrop.co/apis?utm_source=api-sample&utm_medium=decompose-layers"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by <b className="hover:underline">ClipDrop API</b>
        </a>
        <p id="forkongithub">
          <a
            href="https://github.com/initml/clipdrop-api-samples"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              className="mr-3 inline-block"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span className="font-semibold hover:underline">
              Fork me on GitHub
            </span>
          </a>
        </p>
      </footer>
    </div>
  )
}

export default Home
