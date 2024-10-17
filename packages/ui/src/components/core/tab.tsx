import { useState } from 'react'
import { getClass } from '@harmony/util/src/utils/common'

const useTabSelect = (items: TabItem[]) => {
  const [selected, setSelected] = useState<string | number>(items[0]?.id ?? -1)

  const selectedComponent = items.find(
    (item) => item.id === selected,
  )?.component
  if (!selectedComponent) {
    throw new Error(`Could not find tab component with id ${selected}`)
  }

  const onTabSelect = (id: string | number): void => {
    setSelected(id)
  }

  return {
    selectedItem: selected,
    selectedComponent,
    onTabSelect,
  }
}

export interface TabItem {
  label: string
  component: React.ReactElement
  id: string | number
  notification?: NotificationDotColor
}

interface TabControlProps {
  items: TabItem[]
  className?: string
}
export const TabControl: React.FunctionComponent<TabControlProps> = ({
  items,
  className,
}) => {
  const { selectedItem, selectedComponent, onTabSelect } = useTabSelect(items)

  return (
    <div className={className}>
      <div className='hw-text-sm hw-font-medium hw-text-center hw-border-b hw-border-gray-200 dark:hw-text-gray-400 dark:hw-border-gray-700'>
        <ul className='hw-flex hw-flex-wrap -hw-mb-px hw-font-semibold hw-text-2xl'>
          {items.map((item, i) => (
            <li className='hw-mr-2' key={i}>
              <NotificationDot color={item.notification}>
                <button
                  className={getClass(
                    'hw-inline-block hw-px-4 hw-py-2 hw-border-b-2 hw-rounded-t-lg hw-outline-none',
                    selectedItem === item.id
                      ? 'hw-border-b-4 hw-border-primary hw-rounded-t-lg hw-active dark:hw-text-primary-light dark:hw-border-primary-light'
                      : 'hw-border-transparent hover:hw-border-gray-300 dark:hover:hw-text-gray-300',
                  )}
                  onClick={() => {
                    onTabSelect(item.id)
                  }}
                  type='button'
                >
                  {item.label}
                </button>
              </NotificationDot>
            </li>
          ))}
        </ul>
      </div>
      <div className='hw-mt-8 hw-mx-2'>{selectedComponent}</div>
    </div>
  )
}

type NotificationDotColor = 'gray' | 'red' | 'green'
export interface NotificationDotProps {
  children: React.ReactNode
  color: NotificationDotColor | undefined
}
export const NotificationDot: React.FunctionComponent<NotificationDotProps> = ({
  children,
  color,
}) => {
  if (color === undefined) {
    return <>{children}</>
  }

  const colors: Record<NotificationDotColor, string> = {
    gray: 'hw-bg-gray-300',
    red: 'hw-bg-red-400',
    green: 'hw-bg-green-400',
  }

  const dotColor = colors[color]

  return (
    <span className='hw-relative'>
      {children}
      <span
        className={`hw-absolute hw-right-0 hw-top-0 hw-block hw-h-1.5 hw-w-1.5 hw-rounded-full ${dotColor} hw-ring-2 hw-ring-white`}
      />
    </span>
  )
}

export const TabButton: React.FunctionComponent<TabControlProps> = ({
  items,
  className,
}) => {
  const { selectedItem, selectedComponent, onTabSelect } = useTabSelect(items)

  return (
    <div className={className}>
      <ul
        className={getClass(
          'hw-inline-flex hw-gap-2 hw-border hw-rounded-md hw-p-1 hw-bg-gray-100 hw-items-center',
        )}
      >
        {items.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => onTabSelect(item.id)}
              className={getClass(
                'hw-py-1 hw-px-2 hw-rounded-md',
                item.id === selectedItem
                  ? 'hw-bg-white hw-shadow-sm hover:hw-bg-gray-50'
                  : 'hover:hw-bg-gray-200 hover:hw-shadow-sm',
              )}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
      <div className='hw-mt-2'>{selectedComponent}</div>
    </div>
  )
}
