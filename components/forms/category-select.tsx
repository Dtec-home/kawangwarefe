/**
 * Category Select Component
 * Following DRY: Reusable category selector with GraphQL integration
 */

"use client";

import React from "react";
import { UseFormRegister, FieldError } from "react-hook-form";
import { useQuery } from "@apollo/client/react";
import { GET_CONTRIBUTION_CATEGORIES } from "@/lib/graphql/queries";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
  code: string;
  description: string;
}

interface GetCategoriesData {
  contributionCategories: Category[];
}

interface CategorySelectProps {
  label?: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: FieldError;
  required?: boolean;
}

export function CategorySelect({
  label = "Contribution Category",
  name,
  value,
  onChange,
  error,
  required = true,
}: CategorySelectProps) {
  const { data, loading, error: queryError } = useQuery<GetCategoriesData>(
    GET_CONTRIBUTION_CATEGORIES
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange} disabled={loading}>
        <SelectTrigger
          id={name}
          className={error ? "border-destructive" : ""}
        >
          <SelectValue
            placeholder={
              loading
                ? "Loading categories..."
                : "Select a category"
            }
          />
        </SelectTrigger>
        <SelectContent>
          {data?.contributionCategories?.map((category: Category) => (
            <SelectItem key={category.id} value={category.id}>
              <div>
                <div className="font-medium">{category.name}</div>
                {category.description && (
                  <div className="text-xs text-muted-foreground">
                    {category.description}
                  </div>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
      {queryError && (
        <p className="text-sm text-destructive">
          Error loading categories. Please try again.
        </p>
      )}
    </div>
  );
}