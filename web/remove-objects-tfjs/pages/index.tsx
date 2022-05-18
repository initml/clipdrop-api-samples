import type { NextPage } from 'next'
import Head from 'next/head'
import pluralize from 'pluralize'
import { useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import APIKeyInput from '../components/APIKeyInput'
import Landing from '../components/Landing'
import Result from '../components/Result'
import Select from '../components/Select'
import TextAnim from '../components/TextAnim'
import TFJsLogo from '../components/TF_js.png'
import Toggle from '../components/Toggle'
import { cocoSSDClasses } from '../inpaint/cocossd'
import GradientImage from '../components/gradient.webp'

const Home: NextPage = () => {
  const [file, setFile] = useState<File | undefined>()
  const [apiKey, setAPIKey] = useState<string>('')
  const [hd, setHD] = useState(false)
  const [classToShow, setClassToShow] = useState<string | undefined>()
  const [detectedClasses, setDetectedClasses] = useState<string[]>()

  useEffect(() => {
    const key = localStorage.getItem('apiKey') || ''
    setAPIKey(key)
  }, [])

  // Select the first class to show whenever the detectedClasses changes
  useEffect(() => {
    if (detectedClasses?.length) {
      setClassToShow(detectedClasses[0])
    } else {
      setClassToShow(undefined)
    }
  }, [detectedClasses])

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center text-black"
      style={{
        // background: '#222',
        backgroundImage: `url(${GradientImage.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Head>
        <title>ClipDrop API - Remove People</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header
        className={twMerge(
          'flex w-full justify-center px-4 pl-8 sm:justify-between',
          'bg-white bg-opacity-40 shadow-sm backdrop-blur-lg'
        )}
      >
        <div className="flex items-center space-x-4">
          <h1
            className={twMerge(
              'h-20 text-xl font-bold',
              'inline-flex items-center space-x-4'
            )}
          >
            <a
              // className="bg-gradient-to-tr from-cyan-500 to-blue-600 bg-clip-text text-transparent"
              href="https://clipdrop.co/apis?utm_source=api-sample&utm_medium=decompose-layers"
              target="_blank"
              rel="noopener noreferrer"
            >
              ClipDrop API
            </a>
            <span>×</span>
            <a
              href="https://clipdrop.co/apis?utm_s  ource=api-sample&utm_medium=decompose-layers"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={TFJsLogo.src}
                alt="tfjs logo"
                className="mr-2 inline h-10"
              />
            </a>
          </h1>
        </div>
        <div className="hidden items-center space-x-12 sm:flex">
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

      <main className="flex w-full flex-1 flex-col items-center justify-center px-4 text-center">
        <h1
          className={twMerge(
            file ? 'text-2xl md:text-4xl' : 'text-4xl md:text-6xl',
            'mb-8 max-w-4xl font-bold'
          )}
        >
          Automagically remove{' '}
          {detectedClasses && classToShow ? (
            <Select
              items={detectedClasses.map((c) => ({ value: c, name: c }))}
              value={classToShow}
              onChange={setClassToShow}
            />
          ) : (
            <TextAnim texts={cocoSSDClasses.map((c) => pluralize(c))} />
          )}{' '}
          {!file && 'from your images'}
        </h1>
        {!file && (
          <p
            className={twMerge(
              'max-w-2xl font-bold '
              // 'bg-gradient-to-tr from-cyan-500 to-blue-600 bg-clip-text text-transparent'
            )}
          >
            An open-source demo using Tensorflow.js COCOSSD for object detection
            and the ClipDrop API for inpainting.
          </p>
        )}
        {file && apiKey ? (
          <Result
            file={file}
            setFile={setFile}
            apiKey={apiKey}
            hd={hd}
            setDetectedClasses={setDetectedClasses}
            classToShow={classToShow}
          />
        ) : (
          <Landing file={file} setFile={setFile} apiKey={apiKey} />
        )}
      </main>

      <footer
        className={twMerge(
          'mt-4 flex h-24 w-full items-center justify-center space-x-12',
          'border-t border-black border-opacity-5 bg-white bg-opacity-40 backdrop-blur-lg'
        )}
      >
        <span>
          Powered by{' '}
          <a
            href="https://clipdrop.co/apis?utm_source=api-sample&utm_medium=decompose-layers"
            target="_blank"
            rel="noopener noreferrer"
          >
            <b className="hover:underline">ClipDrop API</b>
          </a>{' '}
          and{' '}
          <a
            href="https://www.tensorflow.org/js"
            target="_blank"
            rel="noopener noreferrer"
          >
            <b className="hover:underline">Tensorflow.js</b>
          </a>
        </span>
        <p id="forkongithub">
          <a
            href="https://github.com/initml/clipdrop-api-samples/tree/main/web/remove-objects-tfjs"
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
