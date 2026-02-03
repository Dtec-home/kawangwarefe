/**
 * Category Amount Row Component
 * Single row for selecting a category and entering an amount
 */

"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface CategoryAmountRowProps {
  index: number;
  value: { categoryId: string; amount: string };
  onChange: (index: number, field: "categoryId" | "amount", value: string) => void;
  onRemove: (index: number) => void;
  availableCategories: Category[];
  canRemove: boolean;
  errors?: { categoryId?: string; amount?: string };
}

export function CategoryAmountRow({
  index,
  value,
  onChange,
  onRemove,
  availableCategories,
  canRemove,
  errors,
}: CategoryAmountRowProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end p-4 border rounded-lg bg-card">
      {/* Category Select */}
      <div className="flex-1 w-full space-y-2">
        <Label htmlFor={`category-${index}`} className="text-sm">
          Category <span className="text-destructive">*</span>
        </Label>
        <Select
          value={value.categoryId}
          onValueChange={(val) => onChange(index, "categoryId", val)}
        >
          <SelectTrigger
            id={`category-${index}`}
            className={errors?.categoryId ? "border-destructive" : ""}
          >
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {availableCategories.map((category) => (
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
        {errors?.categoryId && (
          <p className="text-xs text-destructive">{errors.categoryId}</p>
        )}
      </div>

      {/* Amount Input */}
      <div className="flex-1 w-full space-y-2">
        <Label htmlFor={`amount-${index}`} className="text-sm">
          Amount (KES) <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            KES
          </span>
          <Input
            id={`amount-${index}`}
            type="number"
            min="1"
            step="1"
            placeholder="0"
            value={value.amount}
            onChange={(e) => onChange(index, "amount", e.target.value)}
            className={`pl-14 ${errors?.amount ? "border-destructive" : ""}`}
          />
        </div>
        {errors?.amount && (
          <p className="text-xs text-destructive">{errors.amount}</p>
        )}
      </div>

      {/* Remove Button */}
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
          aria-label="Remove category"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
