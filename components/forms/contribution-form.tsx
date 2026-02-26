/**
 * Multi-Category Contribution Form Component
 * Supports selecting multiple categories with amounts and displays summary before submission
 * Following SOLID principles with step-based flow
 */

"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@apollo/client/react";
import { INITIATE_MULTI_CONTRIBUTION } from "@/lib/graphql/multi-contribution-mutations";
import { GET_CONTRIBUTION_CATEGORIES } from "@/lib/graphql/queries";
import { useAuth } from "@/lib/auth/auth-context";
import { PhoneInput } from "./phone-input";
import { MultiCategorySelector, CategoryAmount } from "./multi-category-selector";
import { ContributionSummary } from "./contribution-summary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { GET_PAYMENT_STATUS } from "@/lib/graphql/payment-status-query";

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

type FormStep = "input" | "summary" | "processing" | "waiting" | "success";

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

type PaymentStatusResult = {
  paymentStatus: string;
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

interface ContributionDetails {
  phoneNumber: string;
  totalAmount: string;
  contributions: Array<{ categoryName: string; categoryCode: string; amount: string }>;
  checkoutRequestId: string;
  mpesaReceiptNumber?: string;
}

export function ContributionForm({ onSuccess }: ContributionFormProps) {
  const [step, setStep] = useState<FormStep>("input");
  const [contributionDetails, setContributionDetails] = useState<ContributionDetails | null>(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const pollingAttemptsRef = useRef(0);
  const [pollingIntervalId, setPollingIntervalId] = useState<NodeJS.Timeout | null>(null);
  const onSuccessRef = useRef(onSuccess);

  // Get logged-in user's phone number if available
  const { user: authUser } = useAuth();

  // Extract 9-digit phone from auth (stored as 254XXXXXXXXX)
  const getDefaultPhone = () => {
    if (authUser?.phoneNumber) {
      const phone = authUser.phoneNumber.replace(/^\+?254/, "");
      return phone.length === 9 ? phone : "";
    }
    return "";
  };

  // Keep onSuccess ref in sync so the polling closure always sees the latest
  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);

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
      phoneNumber: getDefaultPhone(),
      contributions: [{ categoryId: "", amount: "" }],
    },
  });

  // Auto-fill phone when auth user loads after form init
  const phoneFilledRef = useRef(false);
  useEffect(() => {
    if (authUser?.phoneNumber && !phoneFilledRef.current) {
      const phone = authUser.phoneNumber.replace(/^\+?254/, "");
      if (phone.length === 9) {
        setValue("phoneNumber", phone);
        phoneFilledRef.current = true;
      }
    }
  }, [authUser, setValue]);

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

  const { refetch: checkPaymentStatus } = useQuery<PaymentStatusResult>(
    GET_PAYMENT_STATUS,
    {
      skip: true, // Don't run automatically
    }
  );

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

  const startPaymentPolling = (checkoutRequestId: string) => {
    setPollingAttempts(0);
    pollingAttemptsRef.current = 0;

    const pollInterval = setInterval(async () => {
      pollingAttemptsRef.current += 1;
      setPollingAttempts(pollingAttemptsRef.current);

      // Check if we've exceeded max attempts (60 seconds)
      if (pollingAttemptsRef.current >= 30) {
        clearInterval(pollInterval);
        setPollingIntervalId(null);
        toast.error("Payment confirmation timeout. Please check your M-Pesa messages.");
        setStep("input");
        return;
      }

      try {
        const { data } = await checkPaymentStatus({
          checkoutRequestId,
        });

        const status = data?.paymentStatus;

        if (status === 'completed') {
          clearInterval(pollInterval);
          setPollingIntervalId(null);

          toast.success("Payment completed successfully!");
          setStep("success");

          // Redirect to confirmation page so the user sees the real DB status
          // (with actual M-Pesa receipt number). Give toast 800ms to render first.
          setTimeout(() => {
            if (onSuccessRef.current && contributionDetails) {
              onSuccessRef.current({ checkoutRequestId: contributionDetails.checkoutRequestId });
            }
          }, 800);
        } else if (status === 'failed') {
          clearInterval(pollInterval);
          setPollingIntervalId(null);
          toast.error("Payment failed. Please try again.");
          setStep("input");
        }
        // If still pending, continue polling
      } catch (error) {
        console.error("Error checking payment status:", error);
      }
    }, 2000); // Poll every 2 seconds

    setPollingIntervalId(pollInterval);
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
        const checkoutRequestId = result.data.initiateMultiCategoryContribution.checkoutRequestId || '';

        // Store contribution details
        setContributionDetails({
          phoneNumber: `254${phoneNumber}`,
          totalAmount: result.data.initiateMultiCategoryContribution.totalAmount || totalAmount,
          contributions: result.data.initiateMultiCategoryContribution.contributions || [],
          checkoutRequestId,
        });

        toast.success("M-Pesa prompt sent! Please check your phone.");
        setStep("waiting");

        // Start polling for payment status
        startPaymentPolling(checkoutRequestId);
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
    // Clear polling if active
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
    }
    setStep("input");
  };

  const handleCancelWaiting = () => {
    // Clear polling
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
    }
    toast("Payment cancelled. You can try again.");
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

  // Waiting for Payment Step
  if (step === "waiting" && contributionDetails) {
    return (
      <Card className="w-full shadow-lg">
        <CardContent className="flex flex-col items-center py-12 space-y-6">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />

          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold">Waiting for Payment Confirmation</h3>
            <p className="text-muted-foreground max-w-md">
              Please complete the payment on your phone{" "}
              <span className="font-semibold">
                ({contributionDetails.phoneNumber.replace(/^254/, '0').replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')})
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Enter your M-Pesa PIN to confirm the payment
            </p>
          </div>

          <div className="w-full max-w-md space-y-4">
            {/* Total Amount */}
            <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg border">
              <span className="font-semibold">Total Amount:</span>
              <span className="text-xl font-bold text-primary">
                KES {parseFloat(contributionDetails.totalAmount).toLocaleString("en-KE")}
              </span>
            </div>

            {/* Polling indicator */}
            <div className="text-center text-sm text-muted-foreground">
              <p>Checking payment status... ({pollingAttempts}/30)</p>
              <p className="text-xs mt-1">This may take up to 60 seconds</p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleCancelWaiting}
            className="mt-4"
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Success Step
  if (step === "success" && contributionDetails) {
    return (
      <Card className="w-full shadow-lg">
        <CardContent className="flex flex-col items-center py-8 space-y-6">
          <CheckCircle2 className="h-16 w-16 text-green-500" />

          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-green-600">
              Payment Completed Successfully!
            </h3>
            <p className="text-muted-foreground max-w-md">
              Thank you for your contribution. You will receive an SMS receipt shortly.
            </p>
          </div>

          <div className="w-full max-w-md space-y-4">
            {/* Total Amount */}
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <span className="font-semibold text-lg">Total Amount:</span>
              <span className="text-2xl font-bold text-green-600">
                KES {parseFloat(contributionDetails.totalAmount).toLocaleString("en-KE")}
              </span>
            </div>

            {/* Contribution Breakdown */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">
                Contribution Breakdown:
              </h4>
              <div className="space-y-2">
                {contributionDetails.contributions.map((contrib, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                    <span className="font-medium">{contrib.categoryName}</span>
                    <span className="font-semibold">
                      KES {parseFloat(contrib.amount).toLocaleString("en-KE")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reference ID */}
            <div className="text-center text-xs text-muted-foreground space-y-1">
              <p>Reference: {contributionDetails.checkoutRequestId}</p>
              <p className="text-green-600 font-medium">✓ Payment Confirmed</p>
            </div>
          </div>

          <Button
            onClick={() => {
              reset();
              setStep("input");
              setContributionDetails(null);
              if (onSuccess) onSuccess(null);
            }}
            size="lg"
            className="w-full max-w-md"
          >
            Make Another Contribution
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}