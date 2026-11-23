"use client";

/**
 * Native department / purpose selects shared by the transfer and move-gift
 * dialogs. Native <select>s keep them label-addressable in tests and usable
 * on small phones.
 */

import { useQuery } from "@apollo/client/react";

import { GET_DEPARTMENT_PURPOSES } from "@/lib/graphql/queries";

export const SELECT_CLASS =
  "border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 block h-11 w-full min-w-0 rounded-md border bg-background px-3 text-base shadow-xs outline-none focus-visible:ring-[3px] md:h-9 md:text-sm";

export interface DepartmentOption {
  id: string;
  name: string;
}

export interface PurposeOption {
  id: string;
  name: string;
}

interface PurposesData {
  departmentPurposes: PurposeOption[];
}

export const purposesVariables = (categoryId: string) => ({ categoryId, isActive: true });

/** Active purposes of a department (none while no department is chosen). */
export function usePurposes(categoryId: string): PurposeOption[] {
  const { data } = useQuery<PurposesData>(GET_DEPARTMENT_PURPOSES, {
    variables: purposesVariables(categoryId),
    skip: !categoryId,
  });
  return categoryId ? (data?.departmentPurposes ?? []) : [];
}

export function DepartmentSelect({
  id,
  label,
  value,
  options,
  onChange,
  placeholder = "Choose a department",
  srOnlyLabel = false,
}: {
  id: string;
  label: string;
  value: string;
  options: DepartmentOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  srOnlyLabel?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={srOnlyLabel ? "sr-only" : "text-sm font-medium"}>
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_CLASS}>
        <option value="">{placeholder}</option>
        {options.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function PurposeSelect({
  id,
  label,
  departmentId,
  value,
  onChange,
  purposeHint = null,
  srOnlyLabel = false,
}: {
  id: string;
  label: string;
  departmentId: string;
  value: string;
  onChange: (value: string) => void;
  /** Pre-select the purpose with this name until the user picks one. */
  purposeHint?: string | null;
  srOnlyLabel?: boolean;
}) {
  const purposes = usePurposes(departmentId);
  const selected = value || (purposeHint ? (purposes.find((p) => p.name === purposeHint)?.id ?? "") : "");
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={srOnlyLabel ? "sr-only" : "text-sm font-medium"}>
        {label}
      </label>
      <select
        id={id}
        value={purposes.some((p) => p.id === selected) ? selected : ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={!departmentId}
        className={SELECT_CLASS}
      >
        <option value="">No purpose (whole department)</option>
        {purposes.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
