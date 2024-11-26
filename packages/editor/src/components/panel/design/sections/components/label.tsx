export const Label: React.FunctionComponent<{
  label: string
  children: React.ReactNode
}> = ({ label, children }) => {
  return (
    <>
      <label className='hw-text-sm'>{label}</label>
      {children}
    </>
  )
}
