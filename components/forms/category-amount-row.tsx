/**
 * Department Amount Row Component
 * Single row for selecting a department and entering an amount
 */

"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GET_DEPARTMENT_PURPOSES,
  GET_PAYBILL_INSTRUCTION_MESSAGE,
} from "@/lib/graphql/queries";
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
  routingMode?: "TOP_LEVEL" | "AUTO_MEMBER_GROUP" | "REQUIRES_PURPOSE" | "OPTIONAL_DETAILS";
}

interface DepartmentPurpose {
  id: string;
  name: string;
  code: string;
  description: string;
}

interface DepartmentPurposesData {
  departmentPurposes: DepartmentPurpose[];
}

interface PaybillInstructionMessageData {
  paybillInstructionMessage: string | null;
}

interface CategoryAmountRowProps {
  index: number;
  value: { categoryId: string; amount: string; purposeId?: string };
  onChange: (index: number, field: "categoryId" | "amount" | "purposeId", value: string) => void;
  onRemove: (index: number) => void;
  availableCategories: Category[];
  selectedCategory?: Category;
  canRemove: boolean;
  errors?: { categoryId?: string; amount?: string; purposeId?: string };
}

export function CategoryAmountRow({
  index,
  value,
  onChange,
  onRemove,
  availableCategories,
  selectedCategory,
  canRemove,
  errors,
}: CategoryAmountRowProps) {
  const requiresPurpose = selectedCategory?.routingMode === "REQUIRES_PURPOSE";
  const parsedAmount = Number(value.amount || 0);
  const hasPositiveAmount = Number.isFinite(parsedAmount) && parsedAmount >= 1;

  const { data: purposeData } = useQuery<DepartmentPurposesData>(
    GET_DEPARTMENT_PURPOSES,
    {
      variables: { categoryId: value.categoryId },
      skip: !value.categoryId || !requiresPurpose,
    }
  );

  const selectedPurposeCode = purposeData?.departmentPurposes?.find(
    (purpose) => purpose.id === value.purposeId
  )?.code;

  const formattedAmount = hasPositiveAmount
    ? `KES ${parsedAmount.toLocaleString()}`
    : undefined;

  const { data: instructionData } = useQuery<PaybillInstructionMessageData>(
    GET_PAYBILL_INSTRUCTION_MESSAGE,
    {
      variables: {
        categoryCode: selectedCategory?.code || "",
        purposeCode: selectedPurposeCode || null,
        amount: formattedAmount || null,
      },
      skip: !selectedCategory?.code || !hasPositiveAmount,
    }
  );

  return (
    <div className="p-4 border rounded-lg bg-card space-y-3">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        {/* Department Select */}
        <div className="flex-1 w-full space-y-2">
          <Label htmlFor={`category-${index}`} className="text-sm">
            Department <span className="text-destructive">*</span>
          </Label>
          <Select
            value={value.categoryId}
            onValueChange={(val) => onChange(index, "categoryId", val)}
          >
            <SelectTrigger
              id={`category-${index}`}
              className={errors?.categoryId ? "border-destructive" : ""}
            >
              <SelectValue placeholder="Select department" />
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

        {requiresPurpose && (
          <div className="flex-1 w-full space-y-2">
            <Label htmlFor={`purpose-${index}`} className="text-sm">
              Purpose <span className="text-destructive">*</span>
            </Label>
            <Select
              value={value.purposeId || ""}
              onValueChange={(val) => onChange(index, "purposeId", val)}
            >
              <SelectTrigger
                id={`purpose-${index}`}
                className={errors?.purposeId ? "border-destructive" : ""}
              >
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent>
                {purposeData?.departmentPurposes?.map((purpose) => (
                  <SelectItem key={purpose.id} value={purpose.id}>
                    <div>
                      <div className="font-medium">{purpose.name}</div>
                      {purpose.description && (
                        <div className="text-xs text-muted-foreground">
                          {purpose.description}
                        </div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors?.purposeId && (
              <p className="text-xs text-destructive">{errors.purposeId}</p>
            )}
          </div>
        )}

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
            aria-label="Remove department"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {instructionData?.paybillInstructionMessage && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <p className="font-medium">Direct Paybill Instruction</p>
          <p>{instructionData.paybillInstructionMessage}</p>
        </div>
      )}
    </div>
  );
}
