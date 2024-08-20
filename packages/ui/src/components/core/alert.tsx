import ReactDOM from 'react-dom'
import { useEffect, useState } from 'react'
import { getClass } from '@harmony/util/src/utils/common'
import { usePrevious } from '../../hooks/previous'
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
      const decresaseTransparency = (transparency: number) => {
        if (transparency <= 0) {
          setLabelProps(undefined)
          return
        }
        const newTrans = transparency - 0.05
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
      <div className='hw-fixed hw-top-[40px] hw-left-0 hw-right-0 hw-z-[100] hw-h-fit'>
        <ClosableContent
          className='hw-w-[400px] hw-mx-auto hw-fill-white'
          xMarkClassName='hw-h-2 hw-w-2 hw-fill-white hw-mr-1 -hw-mt-[14px]'
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
    danger: 'hw-bg-[#FF6565] hw-text-white',
    info: 'hw-bg-[#FFE9BE] hw-text-[#11283B]',
  }
  const color = colors[type]

  return (
    <div
      style={{ opacity: `${(transparency || 1) * 100}%` }}
      className={getClass(
        'hw-py-2 hw-px-4 hw-mb-4 hw-text-sm hw-rounded-lg',
        color,
      )}
      role='alert'
    >
      {children}
    </div>
  )
}
