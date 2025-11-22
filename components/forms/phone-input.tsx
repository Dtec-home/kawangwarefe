/**
 * Phone Input Component
 * Following DRY: Reusable phone input with Kenyan format validation
 */

"use client";

import React from "react";
import { UseFormRegister, FieldError } from "react-hook-form";
import { Phone } from "lucide-react";
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
  placeholder = "254712345678",
  required = true,
}: PhoneInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id={name}
          type="tel"
          placeholder={placeholder}
          className={`pl-10 ${error ? "border-destructive" : ""}`}
          {...register(name)}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
      <p className="text-xs text-muted-foreground">
        Format: 254XXXXXXXXX (Kenyan format)
      </p>
    </div>
  );
}