import { getClass } from "@harmony/util/src/utils/common";

export interface SliderProps {
    value: number,
    onChange: (value: number) => void;
    max: number;
    className?: string
}
export const Slider: React.FunctionComponent<SliderProps> = ({value, onChange, max, className}) => {
    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.valueAsNumber);
    }
    return (
        // <div className="hw-relative hw-w-full hw-min-w-[200px] hw-text-gray-900 hw-h-0.5">
        //     {/* <label className="hw-absolute hw-inset-0 hw-z-10 hw-rounded-l-full hw-h-full hw-pointer-events-none hw-bg-current" style={{width: `${value * 100}%`}}></label> */}
        //     <input className="range hw-inset-0 hw-w-full hw-h-full " type="range" value={value} onChange={onInputChange} max={max}/>
        // </div>
            <div className={getClass("hw-relative hw-w-full hw-min-w-[200px] hw-text-gray-900 hw-h-0.5", className)}>
            <label className="hw-absolute hw-inset-0 hw-z-10 hw-rounded-l-full hw-h-full hw-pointer-events-none hw-bg-current" style={{width:`${value/max * 100}%`}}></label>
            <input type="range" step="1" value={value} onChange={onInputChange} max={max} className="hw-w-full hw-absolute hw-inset-0 hw-bg-transparent hw-cursor-pointer focus:hw-outline-none focus:hw-outline-0 hw-appearance-none [-webkit-appearance:none] [&::-webkit-slider-runnable-track]:hw-h-full [&::-moz-range-track]:hw-h-full [&::-webkit-slider-runnable-track]:hw-rounded-full [&::-moz-range-track]:hw-rounded-full [&::-webkit-slider-runnable-track]:hw-bg-gray-200 [&::-moz-range-track]:hw-bg-gray-200 [&::-moz-range-thumb]:hw-appearance-none [&::-moz-range-thumb]:[-webkit-appearance:none] [&::-webkit-slider-thumb]:hw-appearance-none [&::-webkit-slider-thumb]:[-webkit-appearance:none] [&::-moz-range-thumb]:hw-rounded-full [&::-webkit-slider-thumb]:hw-rounded-full [&::-moz-range-thumb]:hw-border-0 [&::-webkit-slider-thumb]:hw-border-0 [&::-moz-range-thumb]:hw-ring-2 [&::-webkit-slider-thumb]:hw-ring-2 [&::-moz-range-thumb]:hw-ring-current [&::-webkit-slider-thumb]:hw-ring-current [&::-moz-range-thumb]:hw-bg-white [&::-webkit-slider-thumb]:hw-bg-white [&::-moz-range-thumb]:hw-relative [&::-webkit-slider-thumb]:hw-relative [&::-moz-range-thumb]:hw-z-20 [&::-webkit-slider-thumb]:hw-z-20 [&::-moz-range-thumb]:hw-w-2 [&::-webkit-slider-thumb]:hw-w-2 [&::-moz-range-thumb]:hw-h-2 [&::-webkit-slider-thumb]:hw-h-2 [&::-moz-range-thumb]:-hw-mt-[3px] [&::-webkit-slider-thumb]:-hw-mt-[3px]"/>
        </div>
    )
}