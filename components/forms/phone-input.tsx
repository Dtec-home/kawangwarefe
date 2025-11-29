/**
 * Phone Input Component
 * Following DRY: Reusable phone input with Kenyan format validation
 */

"use client";

import React from "react";
import { UseFormRegister, FieldError } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PhoneInputProps {
  label?: string;
  name: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  placeholder?: string;
  required?: boolean;
}

export function PhoneInput({
  label = "Phone Number",
  name,
  register,
  error,
  placeholder = "797030300",
  required = true,
}: PhoneInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
          +254
        </div>
        <Input
          id={name}
          type="tel"
          placeholder={placeholder}
          maxLength={9}
          className={`pl-16 ${error ? "border-destructive" : ""}`}
          {...register(name, {
            onChange: (e) => {
              // Only allow digits
              let value = e.target.value.replace(/\D/g, "");

              // If starts with 0, remove it
              if (value.startsWith("0")) {
                value = value.substring(1);
              }

              // Limit to 9 digits
              e.target.value = value.substring(0, 9);
            }
          })}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
      <p className="text-xs text-muted-foreground">
        Enter your 9-digit M-Pesa number (e.g., 797030300)
      </p>
    </div>
  );
}