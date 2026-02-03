/**
 * Contribution Summary Component
 * Displays a summary of multi-category contributions before final submission
 */

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Edit, Send } from "lucide-react";

interface Category {
  id: string;
  name: string;
  code: string;
}

interface ContributionItem {
  category: Category;
  amount: string;
}

interface ContributionSummaryProps {
  phoneNumber: string;
  contributions: ContributionItem[];
  totalAmount: string;
  onEdit: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ContributionSummary({
  phoneNumber,
  contributions,
  totalAmount,
  onEdit,
  onConfirm,
  isLoading = false,
}: ContributionSummaryProps) {
  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return isNaN(num) ? "0" : num.toLocaleString("en-KE");
  };

  const formatPhoneNumber = (phone: string) => {
    // Format 254712345678 to 0712 345 678
    if (phone.startsWith("254")) {
      const local = "0" + phone.slice(3);
      return local.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3");
    }
    return phone;
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl md:text-2xl">
          Contribution Summary
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Please review your contribution details before proceeding
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contributions List */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Categories
          </h3>
          <div className="space-y-2">
            {contributions.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2"
              >
                <div>
                  <p className="font-medium">{item.category.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.category.code}
                  </p>
                </div>
                <p className="font-semibold">
                  KES {formatAmount(item.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Total Amount */}
        <div className="flex justify-between items-center py-2 bg-primary/5 px-4 rounded-lg">
          <p className="text-lg font-bold">Total Amount</p>
          <p className="text-2xl font-bold text-primary">
            KES {formatAmount(totalAmount)}
          </p>
        </div>

        <Separator />

        {/* Phone Number */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            M-Pesa Number
          </h3>
          <p className="text-lg font-medium">{formatPhoneNumber(phoneNumber)}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onEdit}
            disabled={isLoading}
            className="flex-1"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1"
          >
            <Send className="mr-2 h-4 w-4" />
            {isLoading ? "Processing..." : "Confirm & Send M-Pesa Prompt"}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground pt-2">
          You will receive an M-Pesa prompt on your phone. Enter your PIN to
          complete the contribution.
        </p>
      </CardContent>
    </Card>
  );
}
