/**
 * Contribution Form Component
 * Following SOLID principles and Sprint 1 specifications
 * Includes form validation using react-hook-form + zod
 */

"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@apollo/client/react";
import { INITIATE_CONTRIBUTION } from "@/lib/graphql/mutations";
import { PhoneInput } from "./phone-input";
import { AmountInput } from "./amount-input";
import { CategorySelect } from "./category-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send } from "lucide-react";
import toast from "react-hot-toast";

// Validation schema using Zod
const contributionSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^254\d{9}$/, "Phone number must be in format 254XXXXXXXXX"),
  amount: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 1, {
      message: "Amount must be at least KES 1",
    }),
  categoryId: z.string().min(1, "Please select a category"),
});

type ContributionFormData = z.infer<typeof contributionSchema>;

interface ContributionFormProps {
  onSuccess?: (data: any) => void;
}

// Add explicit types for the mutation response and variables
type InitiateContributionResult = {
  initiateContribution: {
    success: boolean;
    message: string;
    // add other fields returned by the mutation here if needed
  };
};

type InitiateContributionVars = {
  phoneNumber: string;
  amount: string;
  categoryId: string;
};

export function ContributionForm({ onSuccess }: ContributionFormProps) {
  const [categoryValue, setCategoryValue] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<ContributionFormData>({
    resolver: zodResolver(contributionSchema),
  });

  // Use the generics on useMutation so `data` is typed
  const [initiateContribution, { loading }] = useMutation<
    InitiateContributionResult,
    InitiateContributionVars
  >(INITIATE_CONTRIBUTION, {
    onCompleted: (data) => {
      if (data.initiateContribution.success) {
        toast.success(data.initiateContribution.message);
        reset();
        setCategoryValue("");
        onSuccess?.(data.initiateContribution);
      } else {
        toast.error(data.initiateContribution.message);
      }
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const onSubmit = async (data: ContributionFormData) => {
    try {
      await initiateContribution({
        variables: {
          phoneNumber: data.phoneNumber,
          amount: data.amount,
          categoryId: data.categoryId,
        },
      });
    } catch (error) {
      console.error("Submission error:", error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Make a Contribution</CardTitle>
        <CardDescription>
          Enter your details below to initiate a contribution via M-Pesa.
          You'll receive a prompt on your phone to complete the payment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <PhoneInput
            name="phoneNumber"
            register={register}
            error={errors.phoneNumber}
          />

          <AmountInput
            name="amount"
            register={register}
            error={errors.amount}
          />

          <CategorySelect
            name="categoryId"
            value={categoryValue}
            onChange={(value) => {
              setCategoryValue(value);
              setValue("categoryId", value, { shouldValidate: true });
            }}
            error={errors.categoryId}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Initiate Payment
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By submitting this form, you will receive an M-Pesa prompt on your
            phone. Enter your PIN to complete the contribution.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}