import { Label } from './label'
import { DesignInput } from './design-input'

interface InputLabelProps {
  label: string
  value: string
  onChange: (value: string) => void
}
export const InputLabel: React.FunctionComponent<InputLabelProps> = ({
  label,
  value,
  onChange,
}) => {
  return (
    <Label label={label}>
      <DesignInput value={value} onChange={onChange} />
    </Label>
  )
}
