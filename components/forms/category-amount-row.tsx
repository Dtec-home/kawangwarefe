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
  GET_MEMBER_DEPARTMENT_IDENTIFIER,
} from "@/lib/graphql/queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Quick-amount preset chips for faster entry on mobile.
const QUICK_AMOUNTS = [50, 100, 200, 500, 1000] as const;

interface Category {
  id: string;
  name: string;
  code: string;
  description: string;
  routingMode?: "TOP_LEVEL" | "AUTO_MEMBER_GROUP" | "REQUIRES_PURPOSE" | "OPTIONAL_DETAILS";
  hasAutoSplit?: boolean;
  tracksMemberIdentifier?: boolean;
  identifierLabel?: string;
  identifierFormat?: string;
}

interface MemberDepartmentIdentifierData {
  memberDepartmentIdentifier: {
    tracksIdentifier: boolean;
    label: string;
    found: boolean;
    identifier: string | null;
  };
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
  value: { categoryId: string; amount: string; purposeId?: string; memberIdentifier?: string };
  onChange: (index: number, field: "categoryId" | "amount" | "purposeId" | "memberIdentifier", value: string) => void;
  onRemove: (index: number) => void;
  availableCategories: Category[];
  selectedCategory?: Category;
  canRemove: boolean;
  errors?: { categoryId?: string; amount?: string; purposeId?: string; memberIdentifier?: string };
  phoneNumber?: string;
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
  phoneNumber,
}: CategoryAmountRowProps) {
  const requiresPurpose =
    selectedCategory?.routingMode === "REQUIRES_PURPOSE" &&
    !selectedCategory?.hasAutoSplit;
  const tracksIdentifier = selectedCategory?.tracksMemberIdentifier === true;
  const identifierLabel = selectedCategory?.identifierLabel?.trim() || "Member number";
  const parsedAmount = Number(value.amount || 0);
  const hasPositiveAmount = Number.isFinite(parsedAmount) && parsedAmount >= 1;

  // Auto-fill the giver's existing department number once their phone is known.
  const normalizedPhone = (phoneNumber || "").trim();
  const phoneReady = /^\d{9}$/.test(normalizedPhone);
  const { data: identifierLookup } = useQuery<MemberDepartmentIdentifierData>(
    GET_MEMBER_DEPARTMENT_IDENTIFIER,
    {
      variables: { phoneNumber: `254${normalizedPhone}`, categoryId: value.categoryId },
      skip: !tracksIdentifier || !value.categoryId || !phoneReady,
      fetchPolicy: "cache-first",
    }
  );

  const lookedUpIdentifier = identifierLookup?.memberDepartmentIdentifier?.found
    ? identifierLookup?.memberDepartmentIdentifier?.identifier || ""
    : "";

  // Prefill only when the field is still empty so we never clobber user input.
  const currentIdentifier = value.memberIdentifier || "";
  React.useEffect(() => {
    if (tracksIdentifier && lookedUpIdentifier && !currentIdentifier) {
      onChange(index, "memberIdentifier", lookedUpIdentifier);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookedUpIdentifier, tracksIdentifier]);

  const { data: purposeData } = useQuery<DepartmentPurposesData>(
    GET_DEPARTMENT_PURPOSES,
    {
      variables: { categoryId: value.categoryId, isActive: true },
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
          {/* Quick-amount preset chips */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK_AMOUNTS.map((preset) => {
              const isActive = parsedAmount === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChange(index, "amount", String(preset))}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                  }`}
                  aria-label={`Set amount to KES ${preset}`}
                >
                  {preset.toLocaleString("en-KE")}
                </button>
              );
            })}
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

      {/* Department member number (only for departments that track one) */}
      {tracksIdentifier && (
        <div className="space-y-1">
          <Label htmlFor={`identifier-${index}`} className="text-sm">
            {identifierLabel}
          </Label>
          <Input
            id={`identifier-${index}`}
            value={currentIdentifier}
            onChange={(e) => onChange(index, "memberIdentifier", e.target.value)}
            placeholder={`Your ${identifierLabel.toLowerCase()}`}
            className={errors?.memberIdentifier ? "border-destructive" : ""}
          />
          {errors?.memberIdentifier ? (
            <p className="text-xs text-destructive">{errors.memberIdentifier}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {lookedUpIdentifier
                ? `We found your ${identifierLabel.toLowerCase()} — confirm or correct it. It's tagged on this contribution.`
                : `Enter your ${identifierLabel.toLowerCase()} for ${selectedCategory?.name}. It will be saved and tagged on this contribution.`}
            </p>
          )}
        </div>
      )}

      {instructionData?.paybillInstructionMessage && (
        <div className="rounded-md border border-info/30 bg-info/12 px-3 py-2 text-xs text-info">
          <p className="font-medium">Direct Paybill Instruction</p>
          <p>{instructionData.paybillInstructionMessage}</p>
        </div>
      )}
    </div>
  );
}
