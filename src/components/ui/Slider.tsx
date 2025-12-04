interface SliderProps {
  label?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
}

export const Slider = ({ label, min, max, step = 1, value, onChange, unit }: SliderProps): JSX.Element => (
    <div className="flex flex-col gap-2">
      {label && (
        <div className="flex justify-between items-center">
          <label className="text-xs font-sans font-medium text-basilisk-gray-300">
            {label}
          </label>
          <span className="text-xs font-mono text-basilisk-gray-400">
            {value}{unit}
          </span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="
          w-full h-2
          bg-basilisk-gray-700
          rounded-lg
          appearance-none
          cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-basilisk-accent-cool
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-moz-range-thumb]:w-4
          [&::-moz-range-thumb]:h-4
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-basilisk-accent-cool
          [&::-moz-range-thumb]:border-0
          [&::-moz-range-thumb]:cursor-pointer
        "
      />
    </div>
  )
