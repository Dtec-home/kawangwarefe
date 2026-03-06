/**
 * Manual Contribution Entry Page
 * Sprint 4: Admin Dashboard - Manual Contribution Entry
 *
 * Allows admins to manually enter contributions for envelope/cash donations
 */

"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { useQuery } from "@apollo/client/react";
import { CREATE_MANUAL_CONTRIBUTION, LOOKUP_MEMBER_BY_PHONE } from "@/lib/graphql/manual-contribution-mutations";
import { GET_CONTRIBUTION_CATEGORIES } from "@/lib/graphql/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import {
  Save,
  Search,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  UserCheck,
  UserX,
  Plus
} from "lucide-react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  code: string;
}

interface Member {
  id: string;
  fullName: string;
  phoneNumber: string;
  memberNumber: string | null;
  isGuest: boolean;
}

interface GetCategoriesData {
  contributionCategories: Category[];
}

interface LookupMemberResult {
  lookupMemberByPhone: {
    found: boolean;
    member?: Member;
  };
}

interface CreateContributionResult {
  createManualContribution: {
    success: boolean;
    message: string;
  };
}

function ManualContributionPageContent() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [member, setMember] = useState<Member | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [entryType, setEntryType] = useState("envelope");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Get categories
  const { data: categoriesData } = useQuery<GetCategoriesData>(GET_CONTRIBUTION_CATEGORIES);
  const categories: Category[] = categoriesData?.contributionCategories || [];

  const [lookupMember] = useMutation<LookupMemberResult>(LOOKUP_MEMBER_BY_PHONE);
  const [createContribution] = useMutation<CreateContributionResult>(CREATE_MANUAL_CONTRIBUTION);

  const handlePhoneNumberLookup = async () => {
    if (!phoneNumber.trim()) return;

    try {
      const { data } = await lookupMember({
        variables: { phoneNumber: phoneNumber.trim() },
      });

      if (data?.lookupMemberByPhone) {
        const result = data.lookupMemberByPhone;
        if (result.found && result.member) {
          setMember(result.member);
          setIsGuest(result.member.isGuest);
        } else {
          setMember(null);
          setIsGuest(true);
        }
      }
    } catch (err: any) {
      setError(err.message || "Error looking up member");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validation
    if (!phoneNumber.trim()) {
      setError("Phone number is required");
      return;
    }

    if (!amount || parseFloat(amount) < 1) {
      setError("Amount must be at least KES 1.00");
      return;
    }

    if (!categoryId) {
      setError("Please select a category");
      return;
    }

    setSubmitting(true);

    try {
      const { data } = await createContribution({
        variables: {
          phoneNumber: phoneNumber.trim(),
          amount: amount,
          categoryId: categoryId,
          entryType: entryType,
          receiptNumber: receiptNumber.trim() || null,
          notes: notes.trim() || null,
        },
      });

      if (data?.createManualContribution?.success) {
        setSuccess(true);
        // Reset form for next entry
        setPhoneNumber("");
        setMember(null);
        setIsGuest(false);
        setAmount("");
        setCategoryId("");
        setReceiptNumber("");
        setNotes("");
      } else {
        setError(data?.createManualContribution?.message || "Failed to create contribution");
      }
    } catch (err: any) {
      setError(err.message || "Error creating contribution");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    setSuccess(false);
    setError("");
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Page Header */}
        <div className="flex items-center gap-2">
          <Link href="/admin/contributions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Manual Contribution Entry</h1>
            <p className="text-muted-foreground">
              Record contributions from envelopes, cash, or manual entries
            </p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Contribution Recorded</AlertTitle>
            <AlertDescription>
              The contribution has been successfully recorded.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Member Lookup */}
          <Card>
            <CardHeader>
              <CardTitle>Member Information</CardTitle>
              <CardDescription>
                Enter phone number to identify the contributor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0712345678 or 254712345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    onBlur={handlePhoneNumberLookup}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePhoneNumberLookup}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Lookup
                  </Button>
                </div>
              </div>

              {/* Member Display */}
              {member && (
                <Alert>
                  {isGuest ? (
                    <UserX className="h-4 w-4" />
                  ) : (
                    <UserCheck className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {isGuest ? "Guest Member" : "Member Found"}
                  </AlertTitle>
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">{member.fullName}</p>
                      <p className="text-sm">{member.phoneNumber}</p>
                      {member.memberNumber && (
                        <p className="text-sm">Member #: {member.memberNumber}</p>
                      )}
                      {isGuest && (
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                          This is a guest member. You can update their details later.
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {phoneNumber && !member && isGuest && (
                <Alert>
                  <UserX className="h-4 w-4" />
                  <AlertTitle>New Guest Member</AlertTitle>
                  <AlertDescription>
                    This phone number is not registered. A guest member will be created.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Contribution Details */}
          <Card>
            <CardHeader>
              <CardTitle>Contribution Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Entry Type */}
              <div className="space-y-2">
                <Label htmlFor="entryType">Entry Type</Label>
                <Select value={entryType} onValueChange={setEntryType}>
                  <SelectTrigger id="entryType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="envelope">Envelope</SelectItem>
                    <SelectItem value="cash">Local Evangelism/Loose Money</SelectItem>
                    <SelectItem value="manual">Manual Entry</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (KES) *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="1000.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              {/* Receipt Number */}
              <div className="space-y-2">
                <Label htmlFor="receipt">Receipt Number (Optional)</Label>
                <Input
                  id="receipt"
                  type="text"
                  placeholder="ENV001"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this contribution..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Contribution
                </>
              )}
            </Button>

            {success && (
              <Button type="button" variant="outline" onClick={handleAddAnother}>
                <Plus className="h-4 w-4 mr-2" />
                Add Another
              </Button>
            )}

            <Link href="/admin/contributions">
              <Button type="button" variant="outline">
                View All Contributions
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

export default function ManualContributionPage() {
  return (
    <AdminProtectedRoute requiredAccess="staff">
      <ManualContributionPageContent />
    </AdminProtectedRoute>
  );
}
