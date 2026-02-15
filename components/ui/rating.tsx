"use client";

import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface RatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  label?: string;
}

export function Rating({ value, onChange, max = 5, label }: RatingProps) {
  return (
    <div className="space-y-1">
      {label && <span className="text-sm font-medium">{label}</span>}
      <div className="flex gap-1">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n === value ? 0 : n)}
            className="p-0.5 transition-colors"
          >
            <Star
              className={cn(
                "h-5 w-5 transition-colors",
                n <= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/30"
              )}
            />
          </button>
        ))}
        {value > 0 && (
          <span className="text-xs text-muted-foreground self-center ml-1">
            {value}/{max}
          </span>
        )}
      </div>
    </div>
  );
}
