import { useState } from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
  value?: string;
  label?: string;
  helperText?: string;
  disabled?: boolean;
  error?: boolean;
  startIcon?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Selectionner",
  onChange,
  className = "",
  defaultValue = "",
  value = "",
  label = "",
  disabled = false,
  error = false,
  helperText = "",
  startIcon,
}) => {
  // Manage the selected value (uncontrolled mode only)
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string>(defaultValue);
  const selectedValue = isControlled ? value : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange(newValue); // Trigger parent handler
  };

  return (
    <select
      aria-label={label}
      className={`h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-12 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${
        selectedValue
          ? "text-gray-800 dark:text-white/90"
          : "text-gray-400 dark:text-gray-400"
      } ${className}`}
      value={value || selectedValue}
      onChange={handleChange}
      disabled={disabled}
    >
      {startIcon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{startIcon}</span>}
      {/* Placeholder option */}
      <option
        value=""
        disabled
        className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
      >
        {placeholder}
      </option>
      {/* Map over options */}
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
        >
          {option.label}
        </option>
      ))}
      {error && <p className="text-sm text-red-600 mt-1">Erreur de validation</p>}
      {helperText && <p className="text-sm text-gray-500 mt-1">{helperText}</p>}
    </select>
  );
};

export default Select;
