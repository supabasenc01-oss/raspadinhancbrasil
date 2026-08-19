import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ColorInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ColorInput({ id, label, value, onChange, className }: ColorInputProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
            className="pl-10"
          />
          <div 
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 rounded-full border border-border shadow-sm"
            style={{ backgroundColor: value || "#000000" }}
          />
        </div>
        <div className="relative size-9 shrink-0 overflow-hidden rounded-md border border-input shadow-sm hover:ring-1 hover:ring-ring transition-all">
          <input
            type="color"
            value={value?.startsWith("#") ? value : "#3B82F6"}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="absolute inset-[-5px] size-[calc(100%+10px)] cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
