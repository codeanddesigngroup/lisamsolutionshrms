import React from "react";
import { RefreshCw } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "info";
  rounded?: boolean;
  loading?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  rounded = false,
  loading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary: "btn btn-info",
    secondary: "bg-secondary text-white",
    danger: "btn btn-danger",
    info: "btn btn-info",
  };

  return (
    <button
      className={`btn ${variants[variant]} ${className} ${disabled || loading ? "opacity-70 cursor-not-allowed" : ""}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
      <span className="flex items-center justify-center gap-2">{children}</span>
    </button>
  );
}
