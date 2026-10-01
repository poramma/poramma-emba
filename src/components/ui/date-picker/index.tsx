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

// Un peu plus compact que l'ancien h-11/px-4 — surtout visible maintenant que
// le champ ne s'affiche plus qu'une fois (voir plus bas).
const INPUT_CLASSES =
  "h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3.5 py-2 pr-9 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-500/20 disabled:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-white/30 dark:focus:border-brand-700";

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const DatePicker: FC<DatePickerProps> = ({
  label,
  placeholder = "jj/mm/aaaa",
  value,
  onChange,
  mode = "single",
  disabled = false,
  className = "",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<flatpickr.Instance | null>(null);
  // Toujours la dernière version du callback sans redéclencher l'effet de montage.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!inputRef.current) return;

    // Pas d'altInput : flatpickr insère alors un second <input> (l'affichage
    // jj/mm/aaaa) juste à côté de l'original, caché en type="hidden" — en
    // React 18 StrictMode, l'effet de montage s'exécute deux fois en dev et
    // le destroy() de la première instance ne retire pas toujours ce second
    // input proprement, laissant deux champs visibles empilés. Un seul
    // <input>, affiché directement en jj/mm/aaaa et reconverti en ISO nous-
    // mêmes à la sortie, élimine le problème à la racine plutôt que de
    // rafistoler le nettoyage de flatpickr.
    const instance = flatpickr(inputRef.current, {
      mode,
      static: true,
      monthSelectorType: "static",
      locale: { ...French, firstDayOfWeek: 1 },
      dateFormat: "d/m/Y",
      defaultDate: value,

      onChange: (dates) => {
        const picked = dates[0];
        onChangeRef.current?.(picked ? toIsoDate(picked) : "");
      },
    });
    pickerRef.current = instance;

    return () => {
      instance.destroy();
      if (pickerRef.current === instance) pickerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (!pickerRef.current) return;
    if (value) {
      // `value` est toujours en ISO (Y-m-d) ; l'instance est configurée en
      // "d/m/Y" pour l'affichage. Sans ce 3e argument, setDate() parse la
      // chaîne avec le format AFFICHÉ plutôt que le format REÇU : "2026-09-15"
      // relu comme "d/m/Y" tombe sur une tout autre date, silencieusement —
      // c'était la cause du champ qui se corrigeait tout seul vers une date
      // fausse juste après la sélection.
      pickerRef.current.setDate(value, false, "Y-m-d");
    } else {
      // Un filtre réinitialisé par le parent (ex. bouton Réinitialiser) repasse
      // par `undefined` : le champ doit alors se vider aussi, pas garder l'ancienne date.
      pickerRef.current.clear(false);
    }
  }, [value]);

  return (
    <div className={className}>
      {label && <Label>{label}</Label>}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          readOnly
          disabled={disabled}
          placeholder={placeholder}
          className={INPUT_CLASSES}
        />

        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
          <Calendar size={16} />
        </span>
      </div>
    </div>
  );
};

export default DatePicker;
