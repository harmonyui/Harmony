import { getClass } from '@harmony/util/src/utils/common'

export const Label: React.FunctionComponent<{
  label: string
  className?: string
  children: React.ReactNode
}> = ({ label, children, className }) => {
  return (
    <>
      <label
        className={getClass(
          'hw-text-sm hw-text-gray-700 hw-font-normal',
          className,
        )}
      >
        {label}
      </label>
      {children}
    </>
  )
}
