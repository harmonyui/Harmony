export const Label: React.FunctionComponent<{
  label: string
  children: React.ReactNode
}> = ({ label, children }) => {
  return (
    <>
      <label className='hw-text-sm hw-text-gray-700 hw-font-normal'>
        {label}
      </label>
      {children}
    </>
  )
}
