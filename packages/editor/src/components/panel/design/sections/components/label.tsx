export const Label: React.FunctionComponent<{
  label: string
  children: React.ReactNode
}> = ({ label, children }) => {
  return (
    <>
      <label>{label}</label>
      {children}
    </>
  )
}
