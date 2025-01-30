import { getClass } from '@harmony/util/src/utils/common'
import { useState, useEffect } from 'react'

interface CopyTextProps {
  text: string
  widthClass?: string
}
export const CopyText: React.FunctionComponent<CopyTextProps> = ({
  widthClass,
  text,
}) => {
  const [copied, setCopied] = useState(false)
  const [copiedText, setCopiedText] = useState('')
  useEffect(() => {
    if (text !== copiedText) {
      setCopied(false)
    }
  }, [text, copiedText])
  return (
    <div
      className={getClass(
        'rounded h-6 leading-6 cursor-pointer px-1 inline-block transition whitespace-nowrap overflow-hidden text-ellipsis',
        copied
          ? 'text-white bg-primary'
          : 'text-teal-900 bg-gray-200 hover:bg-gray-300',
      )}
      onClick={() => {
        void navigator.clipboard.writeText(text)
        setCopied(true)
        setCopiedText(text)
      }}
    >
      <div className='flex items-center'>
        <svg
          fill='none'
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
          viewBox='0 0 24 24'
          className='w-5 h-5 mr-1'
        >
          <path
            d={
              copied
                ? 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
                : 'M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3'
            }
          ></path>
        </svg>
        <span className={widthClass}>{text}</span>
      </div>
    </div>
  )
}
