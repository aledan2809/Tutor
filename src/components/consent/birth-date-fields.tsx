"use client";

/**
 * „Data nașterii” as three lists (day, month, year): the same on every phone and desktop, no date
 * format to guess. The parent builds the „YYYY-MM-DD” string with birthDateString (age.ts).
 */
const MONTHS = {
  ro: ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

export type BirthDateValue = { day: string; month: string; year: string };

export function BirthDateFields({
  locale,
  value,
  onChange,
  selectClassName,
}: {
  locale: "ro" | "en";
  value: BirthDateValue;
  onChange: (v: BirthDateValue) => void;
  selectClassName: string;
}) {
  const ro = locale === "ro";
  const lastYear = new Date().getFullYear() - 5;
  const years = Array.from({ length: lastYear - 1919 }, (_, i) => String(lastYear - i));
  return (
    <fieldset>
      <legend className="mb-1 block text-sm text-gray-400">{ro ? "Data nașterii" : "Date of birth"}</legend>
      {/* Below 360 px the month gets its own row, so the day and year stay readable. */}
      <div className="grid grid-cols-[1fr_1.4fr] gap-2 min-[360px]:grid-cols-[1fr_2fr_1.4fr]">
        <select
          id="birth-day"
          aria-label={ro ? "Ziua" : "Day"}
          value={value.day}
          onChange={(e) => onChange({ ...value, day: e.target.value })}
          className={selectClassName}
        >
          <option value="">{ro ? "Ziua" : "Day"}</option>
          {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          id="birth-month"
          aria-label={ro ? "Luna" : "Month"}
          value={value.month}
          onChange={(e) => onChange({ ...value, month: e.target.value })}
          className={`${selectClassName} col-span-2 order-last min-[360px]:order-none min-[360px]:col-span-1`}
        >
          <option value="">{ro ? "Luna" : "Month"}</option>
          {MONTHS[locale].map((m, i) => (
            <option key={m} value={String(i + 1)}>{m}</option>
          ))}
        </select>
        <select
          id="birth-year"
          aria-label={ro ? "Anul" : "Year"}
          value={value.year}
          onChange={(e) => onChange({ ...value, year: e.target.value })}
          className={selectClassName}
        >
          <option value="">{ro ? "Anul" : "Year"}</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    </fieldset>
  );
}
