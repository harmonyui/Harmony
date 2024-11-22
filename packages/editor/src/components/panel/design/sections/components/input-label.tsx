import { Label } from './label'
import { DesignInput } from './design-input'

interface InputLabelProps {
  label: string
  value: string
  inputClass?: string
  onChange: (value: string) => void
}
export const InputLabel: React.FunctionComponent<InputLabelProps> = ({
  label,
  value,
  inputClass,
  onChange,
}) => {
  return (
    <Label label={label}>
      <DesignInput className={inputClass} value={value} onChange={onChange} />
    </Label>
  )
}
