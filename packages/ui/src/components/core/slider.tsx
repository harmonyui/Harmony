import { getClass } from '@harmony/util/src/utils/common'

export interface SliderProps {
  value: number
  onChange: (value: number) => void
  max: number
  className?: string
}
export const Slider: React.FunctionComponent<SliderProps> = ({
  value,
  onChange,
  max,
  className,
}) => {
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.valueAsNumber)
  }
  return (
    // <div className="relative w-full min-w-[200px] text-gray-900 h-0.5">
    //     {/* <label className="absolute inset-0 z-10 rounded-l-full h-full pointer-events-none bg-current" style={{width: `${value * 100}%`}}></label> */}
    //     <input className="range inset-0 w-full h-full " type="range" value={value} onChange={onInputChange} max={max}/>
    // </div>
    <div
      className={getClass(
        'relative w-full min-w-[200px] text-gray-900 h-0.5',
        className,
      )}
    >
      <label
        className='absolute inset-0 z-10 rounded-l-full h-full pointer-events-none bg-current'
        style={{ width: `${(value / max) * 100}%` }}
      ></label>
      <input
        type='range'
        step='1'
        value={value}
        onChange={onInputChange}
        max={max}
        className='w-full absolute inset-0 bg-transparent cursor-pointer focus:outline-none focus:outline-0 appearance-none [-webkit-appearance:none] [&::-webkit-slider-runnable-track]:h-full [&::-moz-range-track]:h-full [&::-webkit-slider-runnable-track]:rounded-full [&::-moz-range-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-gray-200 [&::-moz-range-track]:bg-gray-200 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:[-webkit-appearance:none] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:[-webkit-appearance:none] [&::-moz-range-thumb]:rounded-full [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-webkit-slider-thumb]:border-0 [&::-moz-range-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-2 [&::-moz-range-thumb]:ring-current [&::-webkit-slider-thumb]:ring-current [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:relative [&::-webkit-slider-thumb]:relative [&::-moz-range-thumb]:z-20 [&::-webkit-slider-thumb]:z-20 [&::-moz-range-thumb]:w-2 [&::-webkit-slider-thumb]:w-2 [&::-moz-range-thumb]:h-2 [&::-webkit-slider-thumb]:h-2 [&::-moz-range-thumb]:-mt-[3px] [&::-webkit-slider-thumb]:-mt-[3px]'
      />
    </div>
  )
}
