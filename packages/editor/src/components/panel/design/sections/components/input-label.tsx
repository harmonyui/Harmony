import { InputBlur } from '@harmony/ui/src/components/core/input'
import { Label } from './label'

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
      <InputBlur value={value} onChange={onChange} />
    </Label>
  )
}
