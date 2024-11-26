interface CardProps {
  label?: string
  children: React.ReactNode
}
export const Card: React.FunctionComponent<CardProps> = ({
  label,
  children,
}) => {
  return (
    <div className='hw-bg-white hw-rounded-lg hw-p-4'>
      {label ? (
        <div className='hw-flex hw-justify-between hw-items-center hw-mb-2'>
          <h3 className='hw-text-sm hw-text-gray-600'>{label}</h3>
          <div />
        </div>
      ) : null}
      <div>{children}</div>
    </div>
  )
}
