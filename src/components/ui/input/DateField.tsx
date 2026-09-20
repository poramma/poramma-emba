// src/components/ui/input/DateField.tsx

import { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import { French } from "flatpickr/dist/l10n/fr.js";
import "flatpickr/dist/flatpickr.css";

export interface DateFieldProps {
  /** "date" → AAAA-MM-JJ ; "datetime" → AAAA-MM-JJTHH:MM (même format que <input type="datetime-local">). */
  mode: "date" | "datetime";
  id?: string;
  name?: string;
  value?: string | number;
  /** Reçoit un objet compatible `ChangeEvent` (`e.target.value`) — les appelants n'ont rien à changer. */
  onChange?: (e: any) => void;
  onBlur?: (e: any) => void;
  onFocus?: (e: any) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  className?: string;
}

/**
 * Sélecteur de date (calendrier) à la place de la saisie brute d'un
 * <input type="date">. Affiche JJ/MM/AAAA (JJ/MM/AAAA HH:MM), calendrier en
 * français, semaine commençant le lundi, bornes min/max, et renvoie la valeur au
 * format ISO attendu par l'API. La saisie au clavier reste possible.
 */
export function DateField({ mode, id, name, value, onChange, onBlur, onFocus, min, max, placeholder, disabled, readOnly, required, autoFocus, className }: DateFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<flatpickr.Instance | null>(null);
  // Le callback de flatpickr est figé à la création : on lit toujours la dernière version du gestionnaire.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const isDateTime = mode === "datetime";

  useEffect(() => {
    if (!inputRef.current) return;

    const picker = flatpickr(inputRef.current, {
      locale: { ...French, firstDayOfWeek: 1 },
      dateFormat: isDateTime ? "Y-m-d\\TH:i" : "Y-m-d",
      altInput: true,
      altFormat: isDateTime ? "d/m/Y H:i" : "d/m/Y",
      altInputClass: className,
      enableTime: isDateTime,
      time_24hr: true,
      allowInput: true,
      disableMobile: true, // même sélecteur partout (le sélecteur natif mobile n'est pas localisé de la même façon)
      minDate: min || undefined,
      maxDate: max || undefined,
      defaultDate: value ? String(value) : undefined,
      onChange: (_dates, dateStr) => {
        onChangeRef.current?.({ target: { value: dateStr, name, id }, currentTarget: { value: dateStr, name, id } });
      },
    });
    pickerRef.current = picker;

    return () => {
      picker.destroy();
      pickerRef.current = null;
    };
    // Recréé uniquement quand les bornes / le mode changent ; la valeur est synchronisée par l'effet suivant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, min, max]);

  // Valeur pilotée de l'extérieur (réinitialisation d'un filtre, préremplissage…).
  useEffect(() => {
    const picker = pickerRef.current;
    if (!picker) return;
    const current = picker.input.value;
    const next = value ? String(value) : "";
    if (current !== next) picker.setDate(next || (null as any), false);
  }, [value]);

  // État désactivé / lecture seule : appliqué sur le champ visible que flatpickr crée (altInput).
  useEffect(() => {
    const visible = pickerRef.current?.altInput;
    if (!visible) return;
    visible.disabled = !!disabled;
    visible.readOnly = !!readOnly;
    if (placeholder) visible.placeholder = placeholder;
    visible.required = !!required;
    if (autoFocus) visible.focus();
  }, [disabled, readOnly, placeholder, required, autoFocus, mode, min, max]);

  return <input ref={inputRef} type="text" id={id} name={name} onBlur={onBlur} onFocus={onFocus} defaultValue={value ? String(value) : ""} />;
}

export default DateField;
