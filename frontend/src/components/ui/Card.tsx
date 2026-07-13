import React from "react";

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Card({ title, children, className = "" }: CardProps) {
  return (
    <div className={`white-box ${className}`}>
      {title && (
        <h4 className="mb-4">
          {title}
        </h4>
      )}
      {children}
    </div>
  );
}
