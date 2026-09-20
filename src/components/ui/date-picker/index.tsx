import { FC, useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import { French } from "flatpickr/dist/l10n/fr.js";
import "flatpickr/dist/flatpickr.css";

import { Calendar } from "lucide-react";
import Label from "../label";

interface DatePickerProps {
  label?: string;
  placeholder?: string;

  value?: string;

  onChange?: (value: string) => void;

  mode?: "single" | "multiple" | "range" | "time";

  disabled?: boolean;

  className?: string;
}

const INPUT_CLASSES =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-500/20 disabled:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-white/30 dark:focus:border-brand-700";

export const DatePicker: FC<DatePickerProps> = ({
  label,
  placeholder = "Sélectionner une date",
  value,
  onChange,
  mode = "single",
  disabled = false,
  className = "",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<flatpickr.Instance | null>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    pickerRef.current = flatpickr(inputRef.current, {
      mode,
      static: true,
      monthSelectorType: "static",
      locale: { ...French, firstDayOfWeek: 1 },
      dateFormat: "Y-m-d",
      // Affichage jj/mm/aaaa ; la valeur émise reste au format ISO.
      altInput: true,
      altFormat: "d/m/Y",
      altInputClass: INPUT_CLASSES,
      defaultDate: value,

      onChange: (dates, dateStr) => {
        onChange?.(dateStr);
      },
    });

    return () => {
      pickerRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (pickerRef.current && value !== undefined) {
      pickerRef.current.setDate(value, false);
    }
  }, [value]);

  return (
    <div className={className}>
      {label && <Label>{label}</Label>}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          placeholder={placeholder}
          className={INPUT_CLASSES}
        />

        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
          <Calendar size={18} />
        </span>
      </div>
    </div>
  );
};

export default DatePicker;