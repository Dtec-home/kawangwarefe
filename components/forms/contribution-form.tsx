/**
 * Multi-Category Contribution Form Component
 * Supports selecting multiple categories with amounts and displays summary before submission
 * Following SOLID principles with step-based flow
 */

"use client";

import React, { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@apollo/client/react";
import { INITIATE_MULTI_CONTRIBUTION } from "@/lib/graphql/multi-contribution-mutations";
import { GET_CONTRIBUTION_CATEGORIES } from "@/lib/graphql/queries";
import { PhoneInput } from "./phone-input";
import { MultiCategorySelector, CategoryAmount } from "./multi-category-selector";
import { ContributionSummary } from "./contribution-summary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

// Validation schema using Zod
const multiContributionSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\d{9}$/, "Please enter a valid 9-digit phone number"),
  contributions: z
    .array(
      z.object({
        categoryId: z.string().min(1, "Please select a category"),
        amount: z
          .string()
          .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 1, {
            message: "Amount must be at least KES 1",
          }),
      })
    )
    .min(1, "Add at least one contribution")
    .refine(
      (contributions) => {
        const categoryIds = contributions.map((c) => c.categoryId);
        return new Set(categoryIds).size === categoryIds.length;
      },
      { message: "Duplicate categories are not allowed" }
    ),
});

type MultiContributionFormData = z.infer<typeof multiContributionSchema>;

interface ContributionFormProps {
  onSuccess?: (data: any) => void;
}

type FormStep = "input" | "summary" | "processing" | "success";

// Type definitions for GraphQL
type InitiateMultiContributionResult = {
  initiateMultiCategoryContribution: {
    success: boolean;
    message: string;
    totalAmount?: string;
    contributionGroupId?: string;
    contributions?: Array<{
      categoryId: string;
      categoryName: string;
      categoryCode: string;
      amount: string;
    }>;
    checkoutRequestId?: string;
    transactionId?: string;
  };
};

type InitiateMultiContributionVars = {
  phoneNumber: string;
  contributions: Array<{
    categoryId: string;
    amount: string;
  }>;
};

interface Category {
  id: string;
  name: string;
  code: string;
  description: string;
}

interface GetCategoriesData {
  contributionCategories: Category[];
}

type FormStep = "input" | "summary" | "processing" | "success";

export function ContributionForm({ onSuccess }: ContributionFormProps) {
  const [step, setStep] = useState<FormStep>("input");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<MultiContributionFormData>({
    resolver: zodResolver(multiContributionSchema),
    defaultValues: {
      phoneNumber: "",
      contributions: [{ categoryId: "", amount: "" }],
    },
  });

  const contributions = watch("contributions");
  const phoneNumber = watch("phoneNumber");

  // Fetch categories for summary display
  const { data: categoriesData } = useQuery<GetCategoriesData>(
    GET_CONTRIBUTION_CATEGORIES
  );

  const [initiateContribution, { loading: mutationLoading }] = useMutation<
    InitiateMultiContributionResult,
    InitiateMultiContributionVars
  >(INITIATE_MULTI_CONTRIBUTION);

  // Calculate total amount
  const totalAmount = useMemo(() => {
    return contributions
      .reduce((sum, c) => {
        const amount = parseFloat(c.amount || "0");
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0)
      .toFixed(2);
  }, [contributions]);

  // Get contribution items with category details for summary
  const contributionItems = useMemo(() => {
    if (!categoriesData?.contributionCategories) return [];

    return contributions
      .filter((c) => c.categoryId && c.amount)
      .map((c) => {
        const category = categoriesData.contributionCategories.find(
          (cat) => cat.id === c.categoryId
        );
        return category
          ? {
            category,
            amount: c.amount,
          }
          : null;
      })
      .filter(Boolean) as Array<{ category: Category; amount: string }>;
  }, [contributions, categoriesData]);

  const handleReviewClick = () => {
    handleSubmit(() => {
      setStep("summary");
    })();
  };

  const handleConfirmSubmit = async () => {
    try {
      setStep("processing");

      const result = await initiateContribution({
        variables: {
          phoneNumber: `254${phoneNumber}`,
          contributions: contributions.map((c) => ({
            categoryId: c.categoryId,
            amount: c.amount,
          })),
        },
      });

      if (result.data?.initiateMultiCategoryContribution?.success) {
        toast.success("M-Pesa prompt sent! Please check your phone and enter your PIN to complete the payment.");
        setStep("success");

        // Auto-reset after 8 seconds
        setTimeout(() => {
          reset();
          setStep("input");
          if (onSuccess) onSuccess(result.data);
        }, 8000);
      } else {
        const errorMessage =
          result.data?.initiateMultiCategoryContribution?.message ||
          "Failed to initiate contribution.";
        toast.error(errorMessage);
        setStep("input");
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(`Error: ${error.message}`);
      setStep("input");
    }
  };

  const handleEdit = () => {
    setStep("input");
  };

  // Input Step
  if (step === "input") {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl md:text-2xl">
            Make a Contribution
          </CardTitle>
          <CardDescription className="text-sm">
            Select one or more categories and enter amounts. You'll receive a
            single M-Pesa prompt for the total.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5">
            <PhoneInput
              name="phoneNumber"
              register={register}
              error={errors.phoneNumber}
            />

            <div className="space-y-2">
              <MultiCategorySelector
                contributions={contributions}
                onChange={(newContributions) =>
                  setValue("contributions", newContributions, {
                    shouldValidate: true,
                  })
                }
                errors={
                  Array.isArray(errors.contributions)
                    ? errors.contributions.map((err) => ({
                      categoryId: err?.categoryId?.message,
                      amount: err?.amount?.message,
                    }))
                    : undefined
                }
              />
              {errors.contributions?.message && typeof errors.contributions.message === 'string' && (
                <p className="text-sm text-destructive">
                  {errors.contributions.message}
                </p>
              )}
            </div>

            {/* Total Display */}
            {parseFloat(totalAmount) > 0 && (
              <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg border">
                <span className="font-semibold">Total Amount:</span>
                <span className="text-xl font-bold text-primary">
                  KES {parseFloat(totalAmount).toLocaleString("en-KE")}
                </span>
              </div>
            )}

            <Button
              type="button"
              className="w-full h-11"
              onClick={handleReviewClick}
              size="lg"
            >
              Review Contribution
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Summary Step
  if (step === "summary") {
    return (
      <ContributionSummary
        phoneNumber={`254${phoneNumber}`}
        contributions={contributionItems}
        totalAmount={totalAmount}
        onEdit={handleEdit}
        onConfirm={handleConfirmSubmit}
        isLoading={false}
      />
    );
  }

  // Processing Step
  if (step === "processing") {
    return (
      <Card className="w-full shadow-lg">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h3 className="text-xl font-semibold">Processing Your Contribution</h3>
          <p className="text-muted-foreground text-center">
            Sending M-Pesa prompt to your phone...
          </p>
        </CardContent>
      </Card>
    );
  }

  // Success Step
  if (step === "success") {
    return (
      <Card className="w-full shadow-lg">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <h3 className="text-2xl font-bold text-green-600">Success!</h3>
          <p className="text-muted-foreground text-center max-w-md">
            M-Pesa prompt sent successfully. Please check your phone and enter
            your PIN to complete the contribution.
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecting in a moment...
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
}