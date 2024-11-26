export interface ToggleSwitchProps {
  label?: string
  value: boolean
  onChange: (value: boolean) => void
}
export const ToggleSwitch = ({ label, value, onChange }: ToggleSwitchProps) => {
  return (
    <>
      <label className='hw-relative hw-inline-flex hw-items-center hw-cursor-pointer'>
        <input
          type='checkbox'
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className='hw-sr-only hw-peer'
        />
        <div className="hw-w-11 hw-h-6 hw-bg-gray-200 peer-focus:hw-outline-none peer-focus:hw-ring-4 peer-focus:hw-ring-primary-light dark:hw-peer-focus:ring-primary hw-rounded-full hw-peer dark:hw-bg-gray-700 peer-checked:after:hw-translate-x-full peer-checked:after:hw-border-white after:hw-content-[''] after:hw-absolute after:hw-top-[2px] after:hw-left-[2px] after:hw-bg-white after:hw-border-gray-300 after:hw-border after:hw-rounded-full after:hw-h-5 after:hw-w-5 after:hw-transition-all dark:hw-border-gray-600 peer-checked:hw-bg-primary"></div>
        {label && (
          <span className='hw-ml-3 hw-text-sm hw-font-medium hw-text-gray-900 dark:hw-text-gray-300'>
            {label}
          </span>
        )}
      </label>
    </>
  )
}
