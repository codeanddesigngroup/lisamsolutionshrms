import React, { useId } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export default function Input({ label, error, hint, className = "", id, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-[10px] font-black uppercase tracking-widest text-gray-500">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
        className={`form-control ${error ? "is-invalid" : ""} ${className}`}
        {...props}
      />
      {hint && !error && <p id={hintId} className="text-[11px] font-medium text-gray-400">{hint}</p>}
      {error && <p id={errorId} className="text-[11px] font-bold text-red-500">{error}</p>}
    </div>
  );
}
