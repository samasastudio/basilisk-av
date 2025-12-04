interface ToggleProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle({ label, checked, onChange }: ToggleProps): JSX.Element {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={`
          w-11 h-6
          rounded-full
          transition-colors duration-200
          ${checked
            ? 'bg-basilisk-accent-cool'
            : 'bg-basilisk-gray-700'
          }
        `.trim()}>
          <div className={`
            absolute top-1 left-1
            w-4 h-4
            bg-white
            rounded-full
            transition-transform duration-200
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `.trim()} />
        </div>
      </div>
      {label && (
        <span className="text-sm font-sans text-basilisk-gray-100">
          {label}
        </span>
      )}
    </label>
  );
}
