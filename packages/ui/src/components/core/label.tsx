type LabelProps = {
  className?: string
  label: string
  sameLine?: boolean
} & React.PropsWithChildren
export const Label: React.FunctionComponent<LabelProps> = ({
  children,
  className,
  label,
  sameLine,
}) => {
  return (
    <div
      className={`${className || ''} ${
        sameLine ? 'hw-flex hw-items-center' : ''
      }`}
    >
      <label className='hw-block hw-text-sm hw-font-medium hw-leading-6 hw-text-gray-900 dark:hw-text-white'>
        {label}
      </label>
      <div className={`${sameLine ? 'hw-ml-2' : 'hw-mt-2'} `}>{children}</div>
    </div>
  )
}
