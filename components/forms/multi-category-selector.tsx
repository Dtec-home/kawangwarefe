/**
 * Multi-Category Selector Component
 * Manages multiple category-amount rows with add/remove functionality
 */

"use client";

import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryAmountRow } from "./category-amount-row";
import { useQuery } from "@apollo/client/react";
import { GET_CONTRIBUTION_CATEGORIES } from "@/lib/graphql/queries";

interface Category {
  id: string;
  name: string;
  code: string;
  description: string;
}

interface GetCategoriesData {
  contributionCategories: Category[];
}

export interface CategoryAmount {
  categoryId: string;
  amount: string;
}

interface MultiCategorySelectorProps {
  contributions: CategoryAmount[];
  onChange: (contributions: CategoryAmount[]) => void;
  errors?: Array<{ categoryId?: string; amount?: string }>;
  maxCategories?: number;
}

export function MultiCategorySelector({
  contributions,
  onChange,
  errors = [],
  maxCategories = 10,
}: MultiCategorySelectorProps) {
  const { data, loading } = useQuery<GetCategoriesData>(
    GET_CONTRIBUTION_CATEGORIES
  );

  const allCategories = data?.contributionCategories || [];

  // Get selected category IDs
  const selectedCategoryIds = new Set(
    contributions.map((c) => c.categoryId).filter(Boolean)
  );

  // Filter available categories for each row
  const getAvailableCategories = (currentCategoryId: string) => {
    return allCategories.filter(
      (cat) =>
        cat.id === currentCategoryId || !selectedCategoryIds.has(cat.id)
    );
  };

  const handleChange = (
    index: number,
    field: "categoryId" | "amount",
    value: string
  ) => {
    const updated = [...contributions];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    const updated = contributions.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleAdd = () => {
    if (contributions.length < maxCategories) {
      onChange([...contributions, { categoryId: "", amount: "" }]);
    }
  };

  const canAddMore =
    contributions.length < maxCategories &&
    contributions.length < allCategories.length;

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-24 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {contributions.map((contribution, index) => (
          <CategoryAmountRow
            key={index}
            index={index}
            value={contribution}
            onChange={handleChange}
            onRemove={handleRemove}
            availableCategories={getAvailableCategories(contribution.categoryId)}
            canRemove={contributions.length > 1}
            errors={errors && errors[index] ? errors[index] : undefined}
          />
        ))}
      </div>

      {canAddMore && (
        <Button
          type="button"
          variant="outline"
          onClick={handleAdd}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Another Category
        </Button>
      )}

      {contributions.length >= maxCategories && (
        <p className="text-xs text-muted-foreground text-center">
          Maximum {maxCategories} categories reached
        </p>
      )}
    </div>
  );
}
