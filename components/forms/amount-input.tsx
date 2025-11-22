/**
 * Amount Input Component
 * Following DRY: Reusable amount input with currency formatting
 */

"use client";

import React from "react";
import { UseFormRegister, FieldError } from "react-hook-form";
import { DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AmountInputProps {
  label?: string;
  name: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  placeholder?: string;
  required?: boolean;
  min?: number;
}

export function AmountInput({
  label = "Amount",
  name,
  register,
  error,
  placeholder = "500",
  required = true,
  min = 1,
}: AmountInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
          KES
        </div>
        <Input
          id={name}
          type="number"
          step="0.01"
          min={min}
          placeholder={placeholder}
          className={`pl-14 ${error ? "border-destructive" : ""}`}
          {...register(name, { valueAsNumber: false })}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
      <p className="text-xs text-muted-foreground">
        Minimum amount: KES {min}
      </p>
    </div>
  );
}