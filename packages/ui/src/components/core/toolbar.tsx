import type { ButtonType } from './button'
import { Button } from './button'
import type { IconComponent } from './icons'

export interface ToolbarItem {
  icon: IconComponent
  onClick: () => void
  mode: Exclude<ButtonType, 'other'>
  label: string
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
    <div className='hw-absolute hw-bottom-2 hw-left-1/2'>
      <ToolbarContent {...props} />
    </div>
  )
}

const ToolbarContent: React.FunctionComponent<ToolbarProps> = ({ items }) => {
  return (
    <div className='hw-flex hw-gap-2 hw-bg-white hw-rounded-lg hw-p-1'>
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
}) => {
  return (
    <Button
      className='hw-group hw-w-12 hw-h-10 !hw-rounded-lg'
      onClick={onClick}
      mode={mode}
    >
      <div className='hw-block group-hover:hw-hidden hw-h-6 hw-w-6'>
        <Icon className='hw-w-full hw-h-full' />
      </div>
      <div className='hw-hidden group-hover:hw-flex hw-flex-col hw-items-center hw-h-6 hw-w-6 hw-gap-1'>
        <span className='hw-text-[11px] hw-leading-[7px]'>{label}</span>
        <Icon className='hw-h-4 hw-w-4' />
      </div>
    </Button>
  )
}
