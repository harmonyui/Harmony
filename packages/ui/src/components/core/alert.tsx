import ReactDOM from 'react-dom'
import { useEffect, useState } from 'react'
import { getClass } from '@harmony/util/src/utils/common'
import { ClosableContent } from './closable-content'

interface AlertProps {
  label: string | undefined
  setLabel: (value: string | undefined) => void
  type?: 'danger' | 'info'
}
export const Alert: React.FunctionComponent<AlertProps> = ({
  label: labelProps,
  setLabel: setLabelProps,
  type = 'danger',
}) => {
  const [transparency, setTransparency] = useState(1)
  const [label, setLabel] = useState(labelProps)

  useEffect(() => {
    if (label) {
      const decresaseTransparency = (_transparency: number) => {
        if (_transparency <= 0) {
          setLabelProps(undefined)
          return
        }
        const newTrans = _transparency - 0.05
        setTransparency(Math.max(0, newTrans))
        setTimeout(() => decresaseTransparency(newTrans), 50)
      }
      setTransparency(1)
      setTimeout(() => decresaseTransparency(1), 5000)
    }
  }, [label])

  useEffect(() => {
    if (label !== labelProps) {
      setLabel(labelProps)
    }
  }, [labelProps])

  const onClose = () => {
    setLabelProps(undefined)
  }
  return ReactDOM.createPortal(
    label ? (
      <div className='fixed top-[40px] left-0 right-0 z-[100] h-fit'>
        <ClosableContent
          className='w-[400px] mx-auto fill-white'
          xMarkClassName='h-2 w-2 fill-white mr-1 -mt-[14px]'
          onClose={onClose}
        >
          <InfoBox transparency={transparency} type={type}>
            {label}
          </InfoBox>
        </ClosableContent>
      </div>
    ) : null,
    document.getElementById('harmony-container') || document.body,
  )
}

interface InfoBoxProps {
  children: React.ReactNode
  transparency?: number
  type: 'danger' | 'info'
}
export const InfoBox: React.FunctionComponent<InfoBoxProps> = ({
  children,
  transparency,
  type,
}) => {
  const colors = {
    danger: 'bg-[#FF6565] text-white',
    info: 'bg-[#FFE9BE] text-[#11283B]',
  }
  const color = colors[type]

  return (
    <div
      style={{ opacity: `${(transparency || 1) * 100}%` }}
      className={getClass('py-2 px-4 mb-4 text-sm rounded-lg', color)}
      role='alert'
    >
      {children}
    </div>
  )
}
