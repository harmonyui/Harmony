import { useState } from 'react'
import { getClass } from '@harmony/util/src/utils/common'
import { Alert } from './alert'
import type { ButtonType } from './button'
import { Button } from './button'
import type { IconComponent } from './icons'

export interface ToolbarItem {
  icon: IconComponent
  onClick?: () => void
  mode: Exclude<ButtonType, 'other'>
  label: string
  loading?: boolean
  disabled?: boolean
  active?: boolean
}
export interface ToolbarProps {
  items: ToolbarItem[]
}
/**
 * Generic Toolbar component
 */
export const Toolbar: React.FunctionComponent<ToolbarProps> = ({
  ...props
}) => {
  return (
    <div className='absolute bottom-2 left-1/2 -translate-x-1/2 z-[999]'>
      <ToolbarContent {...props} />
    </div>
  )
}

const ToolbarContent: React.FunctionComponent<ToolbarProps> = ({ items }) => {
  return (
    <div className='flex gap-2 bg-white rounded-lg p-1'>
      {items.map((item, index) => (
        <ToolbarItem key={index} {...item} />
      ))}
    </div>
  )
}

const ToolbarItem: React.FunctionComponent<ToolbarItem> = ({
  icon: Icon,
  onClick,
  mode,
  label,
  loading,
  disabled,
  active,
}) => {
  const [info, setInfo] = useState<string | undefined>(undefined)
  const onClickDefault = (): void => {
    setInfo(`The ${label} item is coming soon!`)
  }
  return (
    <>
      <Button
        className={getClass(
          'group flex items-center justify-center w-12 h-10 !rounded-lg hover:bg-[#E5E7EB]',
          active ? 'bg-[#E5E7EB]' : '',
        )}
        onClick={() => (onClick ? onClick() : onClickDefault())}
        mode={mode}
        loading={loading}
        disabled={disabled}
      >
        <div className='block group-hover:hidden h-5 w-5'>
          <Icon className='w-full h-full' />
        </div>
        <div className='hidden group-hover:flex flex-col items-center h-6 w-6 gap-1'>
          <span className='text-[8px] leading-[7px]'>{label}</span>
          <Icon className='h-4 w-4' />
        </div>
      </Button>
      <Alert label={info} setLabel={setInfo} type='info' />
    </>
  )
}
