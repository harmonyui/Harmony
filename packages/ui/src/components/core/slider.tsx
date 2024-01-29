export interface SliderProps {
    value: number,
    onChange: (value: number) => void;
    max: number;
}
export const Slider: React.FunctionComponent<SliderProps> = ({value, onChange, max}) => {
    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.valueAsNumber);
    }
    return (
        <div className="hw-relative hw-w-full hw-min-w-[200px] hw-text-gray-900 hw-h-2">
            {/* <label className="hw-absolute hw-inset-0 hw-z-10 hw-rounded-l-full hw-h-full hw-pointer-events-none hw-bg-current" style={{width: `${value * 100}%`}}></label> */}
            <input className="hw-inset-0 hw-w-full hw-bg-transparent" type="range" value={value} onChange={onInputChange} max={max}/>
        </div>
    )
}