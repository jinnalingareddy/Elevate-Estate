"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Major Mexican cities with their states for context
const MEXICAN_CITIES: { city: string; state: string }[] = [
  { city: "Ciudad de México", state: "CDMX" },
  { city: "Guadalajara", state: "Jalisco" },
  { city: "Monterrey", state: "Nuevo León" },
  { city: "Puebla", state: "Puebla" },
  { city: "Tijuana", state: "Baja California" },
  { city: "León", state: "Guanajuato" },
  { city: "Juárez", state: "Chihuahua" },
  { city: "Zapopan", state: "Jalisco" },
  { city: "Mérida", state: "Yucatán" },
  { city: "San Luis Potosí", state: "San Luis Potosí" },
  { city: "Aguascalientes", state: "Aguascalientes" },
  { city: "Hermosillo", state: "Sonora" },
  { city: "Mexicali", state: "Baja California" },
  { city: "Culiacán", state: "Sinaloa" },
  { city: "Acapulco", state: "Guerrero" },
  { city: "Querétaro", state: "Querétaro" },
  { city: "Chihuahua", state: "Chihuahua" },
  { city: "Morelia", state: "Michoacán" },
  { city: "Veracruz", state: "Veracruz" },
  { city: "Torreón", state: "Coahuila" },
  { city: "Tlalnepantla", state: "Estado de México" },
  { city: "Ecatepec", state: "Estado de México" },
  { city: "Tuxtla Gutiérrez", state: "Chiapas" },
  { city: "Saltillo", state: "Coahuila" },
  { city: "Toluca", state: "Estado de México" },
  { city: "Xalapa", state: "Veracruz" },
  { city: "Cancún", state: "Quintana Roo" },
  { city: "Manzanillo", state: "Colima" },
  { city: "Mazatlán", state: "Sinaloa" },
  { city: "Tepic", state: "Nayarit" },
  { city: "Villahermosa", state: "Tabasco" },
  { city: "Durango", state: "Durango" },
  { city: "Reynosa", state: "Tamaulipas" },
  { city: "Matamoros", state: "Tamaulipas" },
  { city: "Nuevo Laredo", state: "Tamaulipas" },
  { city: "Tampico", state: "Tamaulipas" },
  { city: "Victoria", state: "Tamaulipas" },
  { city: "Oaxaca", state: "Oaxaca" },
  { city: "Colima", state: "Colima" },
  { city: "Cuernavaca", state: "Morelos" },
  { city: "Pachuca", state: "Hidalgo" },
  { city: "Irapuato", state: "Guanajuato" },
  { city: "Celaya", state: "Guanajuato" },
  { city: "Guanajuato", state: "Guanajuato" },
  { city: "La Paz", state: "Baja California Sur" },
  { city: "Los Cabos", state: "Baja California Sur" },
  { city: "Puerto Vallarta", state: "Jalisco" },
  { city: "Riviera Maya", state: "Quintana Roo" },
  { city: "Playa del Carmen", state: "Quintana Roo" },
  { city: "Tulum", state: "Quintana Roo" },
  { city: "Huixquilucan", state: "Estado de México" },
  { city: "Naucalpan", state: "Estado de México" },
  { city: "Tlalpan", state: "CDMX" },
  { city: "Benito Juárez", state: "CDMX" },
  { city: "Miguel Hidalgo", state: "CDMX" },
  { city: "Cuauhtémoc", state: "CDMX" },
  { city: "Coyoacán", state: "CDMX" },
  { city: "Álvaro Obregón", state: "CDMX" },
  { city: "Iztapalapa", state: "CDMX" },
  { city: "Azcapotzalco", state: "CDMX" },
  { city: "Tlatelolco", state: "CDMX" },
  { city: "Santa Fe", state: "CDMX" },
  { city: "Polanco", state: "CDMX" },
  { city: "San Ángel", state: "CDMX" },
  { city: "Pedregal", state: "CDMX" },
  { city: "Lomas de Chapultepec", state: "CDMX" },
  { city: "Tlaquepaque", state: "Jalisco" },
  { city: "Tonalá", state: "Jalisco" },
  { city: "San Pedro Garza García", state: "Nuevo León" },
  { city: "Escobedo", state: "Nuevo León" },
  { city: "Apodaca", state: "Nuevo León" },
  { city: "San Nicolás de los Garza", state: "Nuevo León" },
  { city: "Tlanepantla de Baz", state: "Estado de México" },
  { city: "Zinacantepec", state: "Estado de México" },
  { city: "Metepec", state: "Estado de México" },
  { city: "Zumpango", state: "Estado de México" },
  { city: "Texcoco", state: "Estado de México" },
  { city: "San Cristóbal de las Casas", state: "Chiapas" },
  { city: "Comitán", state: "Chiapas" },
  { city: "Campeche", state: "Campeche" },
  { city: "Chetumal", state: "Quintana Roo" },
  { city: "Progreso", state: "Yucatán" },
  { city: "Valladolid", state: "Yucatán" },
  { city: "Tehuacán", state: "Puebla" },
  { city: "San Andrés Cholula", state: "Puebla" },
  { city: "Atlixco", state: "Puebla" },
  { city: "Orizaba", state: "Veracruz" },
  { city: "Coatzacoalcos", state: "Veracruz" },
  { city: "Poza Rica", state: "Veracruz" },
  { city: "Minatitlán", state: "Veracruz" },
  { city: "Ixtapa-Zihuatanejo", state: "Guerrero" },
  { city: "Taxco", state: "Guerrero" },
  { city: "Los Mochis", state: "Sinaloa" },
  { city: "Guasave", state: "Sinaloa" },
  { city: "Nogales", state: "Sonora" },
  { city: "Ensenada", state: "Baja California" },
  { city: "Rosarito", state: "Baja California" },
  { city: "Delicias", state: "Chihuahua" },
  { city: "Parral", state: "Chihuahua" },
  { city: "Monclova", state: "Coahuila" },
  { city: "Piedras Negras", state: "Coahuila" },
  { city: "Zacatecas", state: "Zacatecas" },
  { city: "Fresnillo", state: "Zacatecas" },
];

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: boolean;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
  className?: string;
}

export function CityAutocomplete({
  value,
  onChange,
  onBlur,
  error,
  disabled,
  id,
  placeholder = "Ej. Ciudad de México",
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const suggestions =
    value.length >= 1
      ? MEXICAN_CITIES.filter(({ city, state }) =>
          normalize(`${city} ${state}`).includes(normalize(value))
        ).slice(0, 8)
      : [];

  useEffect(() => {
    setHighlighted(0);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectCity(city: string) {
    onChange(city);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions[highlighted]) selectCity(suggestions[highlighted].city);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const inputCls = cn(
    "w-full rounded-lg border px-3 py-2 text-sm transition-colors outline-none",
    "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100",
    "placeholder:text-slate-400 dark:placeholder:text-slate-500",
    "disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-700/50",
    error
      ? "border-red-400 focus:ring-2 focus:ring-red-200"
      : "border-slate-200 dark:border-slate-700 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 dark:focus:ring-gold-900/30",
    className
  );

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => !disabled && value.length >= 1 && setOpen(true)}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        className={inputCls}
      />

      {open && suggestions.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          className={cn(
            "absolute z-50 mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700",
            "bg-white dark:bg-slate-800 shadow-lg",
            "max-h-56 overflow-y-auto py-1"
          )}
        >
          {suggestions.map(({ city, state }, i) => (
            <li
              key={`${city}-${state}`}
              role="option"
              aria-selected={i === highlighted}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur before click
                selectCity(city);
              }}
              onMouseEnter={() => setHighlighted(i)}
              className={cn(
                "flex items-center justify-between px-3 py-2 cursor-pointer text-sm",
                i === highlighted
                  ? "bg-gold-50 dark:bg-gold-900/20 text-gold-700 dark:text-gold-300"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              )}
            >
              <span className="font-medium">{city}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 ml-2 shrink-0">
                {state}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
