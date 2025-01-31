import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism' // Choose the theme you prefer
import { ClipboardIcon } from './icons' // Make sure to import the ClipboardIcon from Heroicons

interface CodeSnippetProps {
  language: string
  code: string
  showLineNumbers?: boolean
}

const CodeSnippet: React.FC<CodeSnippetProps> = ({
  language,
  code,
  showLineNumbers = false,
}) => {
  //const codeContainerRef = useRef<HTMLPreElement | null>(null)
  const [copied, setCopied] = useState(false)

  const copyCodeToClipboard = () => {
    void navigator.clipboard.writeText(code)
    setCopied(true)
  }

  return (
    <div className='rounded-lg shadow-md overflow-hidden text-sm'>
      <div className='flex justify-between bg-gray-700 p-4 items-center text-white'>
        <h2 className='font-semibold uppercase'>{language}</h2>
        {copied ? (
          <span className=''>Copied!</span>
        ) : (
          <button
            onClick={copyCodeToClipboard}
            className='flex items-center p-1 bg-primary rounded-md hover:bg-primary/80 focus:outline-none focus:ring focus:border-blue-300'
          >
            <ClipboardIcon className='w-5 h-5 ' />
            <span className='ml-2 '>Copy code</span>
          </button>
        )}
      </div>
      {/* <pre
        ref={codeContainerRef}
        className="overflow-x-auto max-h-48 text-white p-4"
      >
        <code>{code}</code>
      </pre> */}
      <SyntaxHighlighter
        showLineNumbers={showLineNumbers}
        language={language}
        style={atomDark}
        customStyle={{ margin: '0', borderRadius: '0' }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

export default CodeSnippet
