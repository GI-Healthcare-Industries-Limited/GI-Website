"use client";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { dateLabel, monthDays, shiftMonth } from "@/lib/booking-dates";
import styles from "./month-picker.module.css";
export function MonthPicker({
  month,
  onMonth,
  selected,
  onSelect,
  available,
  marked = [],
  minMonth,
  maxMonth,
  disabled = false,
}: {
  month: string;
  onMonth: (month: string) => void;
  selected: string;
  onSelect: (day: string) => void;
  available: string[];
  marked?: string[];
  minMonth: string;
  maxMonth: string;
  disabled?: boolean;
}) {
  return (
    <div className={styles.calendar}>
      <div className={styles.heading}>
        <button
          type="button"
          aria-label="Previous month"
          disabled={disabled || month <= minMonth}
          onClick={() => onMonth(shiftMonth(month, -1))}
        >
          <CaretLeftIcon size={20} />
        </button>
        <h3 aria-live="polite">
          {dateLabel(`${month}-01`, { month: "long", year: "numeric" })}
        </h3>
        <button
          type="button"
          aria-label="Next month"
          disabled={disabled || month >= maxMonth}
          onClick={() => onMonth(shiftMonth(month, 1))}
        >
          <CaretRightIcon size={20} />
        </button>
      </div>
      <div className={styles.weekdays} aria-hidden>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className={styles.days} role="group" aria-label="Choose a date">
        {monthDays(month).map((day, index) =>
          day ? (
            <button
              type="button"
              key={day}
              disabled={disabled || !available.includes(day)}
              aria-label={`${dateLabel(day)}${marked.includes(day) ? ", availability saved" : ""}`}
              aria-pressed={selected === day}
              onClick={() => onSelect(day)}
            >
              {Number(day.slice(-2))}
              {marked.includes(day) && <i aria-hidden />}
            </button>
          ) : (
            <span key={`empty-${index}`} />
          ),
        )}
      </div>
    </div>
  );
}
