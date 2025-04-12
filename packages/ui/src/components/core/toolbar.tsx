import { useState } from 'react'
import { getClass } from '@harmony/util/src/utils/common'
import { Alert } from './alert'
import type { ButtonType } from './button'
import { Button } from './button'
import type { IconComponent } from './icons'
import { Dock, DockIcon } from '../magicui/dock'
import { Separator } from '../shadcn/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../shadcn/tooltip'
import { cn } from '../../libs/utils'

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
  items: ToolbarItem[][]
}
/**
 * Generic Toolbar component
 */
export const Toolbar: React.FunctionComponent<ToolbarProps> = ({ items }) => {
  const [info, setInfo] = useState<string | undefined>(undefined)
  const onClickDefault = (label: string): void => {
    setInfo(`The ${label} item is coming soon!`)
  }
  return (
    <>
      <Dock direction='middle'>
        {items.map((item, i) => (
          <>
            {item.map(
              ({
                active,
                label,
                icon: Icon,
                onClick,
                mode,
                loading,
                disabled,
              }) => (
                <DockIcon key={label}>
                  <Button
                    className={getClass(
                      'group flex items-center justify-center w-12 h-10 !rounded-lg outline-none !cursor-pointer disabled:opacity-50',
                      active ? 'bg-[#E5E7EB]' : '',
                      disabled ? '' : 'hover:bg-[#E5E7EB]',
                    )}
                    onClick={() =>
                      onClick ? onClick() : onClickDefault(label)
                    }
                    mode={mode}
                    loading={loading}
                    disabled={disabled}
                  >
                    <div
                      className={cn(
                        'h-5 w-5',
                        label && !disabled ? 'block group-hover:hidden' : '',
                      )}
                    >
                      <Icon className='w-full h-full' />
                    </div>
                    {label && !disabled ? (
                      <div className='hidden group-hover:flex flex-col items-center h-6 w-6 gap-1'>
                        <span className='text-[8px] leading-[7px]'>
                          {label}
                        </span>
                        <Icon className='h-4 w-4' />
                      </div>
                    ) : null}
                  </Button>
                </DockIcon>
              ),
            )}
            {i < items.length - 1 ? (
              <Separator orientation='vertical' className='h-full' />
            ) : null}
          </>
        ))}
      </Dock>
      <Alert label={info} setLabel={setInfo} type='info' />
    </>
  )
}
