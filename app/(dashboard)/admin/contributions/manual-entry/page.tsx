/**
 * Manual Contribution Entry Page
 * Sprint 4: Admin Dashboard - Manual Contribution Entry
 *
 * Allows admins to manually enter contributions for envelope/cash donations.
 * Supports multiple line items (Ticket 6), walk-in givers with no phone
 * (Ticket 7) and auto-incrementing book receipt numbers (Ticket 9).
 */

"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  CREATE_MANUAL_MULTI_CONTRIBUTION,
  LOOKUP_MEMBER_BY_PHONE,
  GET_NEXT_RECEIPT_NUMBER,
} from "@/lib/graphql/manual-contribution-mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import {
  MultiCategorySelector,
  CategoryAmount,
} from "@/components/forms/multi-category-selector";
import {
  Save,
  Search,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  UserCheck,
  UserX,
  Plus,
  Settings,
} from "lucide-react";
import Link from "next/link";

interface Member {
  id: string;
  fullName: string;
  phoneNumber: string;
  memberNumber: string | null;
  isGuest: boolean;
}

interface LookupMemberResult {
  lookupMemberByPhone: {
    found: boolean;
    member?: Member;
  };
}

interface NextReceiptNumberResult {
  nextReceiptNumber: {
    prefix: string;
    nextNumber: number;
    padding: number;
    nextReceiptNumber: string;
  } | null;
}

interface CreateMultiContributionResult {
  createManualMultiContribution: {
    success: boolean;
    message: string;
  };
}

const emptyLine = (): CategoryAmount => ({ categoryId: "", amount: "", purposeId: "" });

function ManualContributionPageContent() {
  const [walkIn, setWalkIn] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [giverName, setGiverName] = useState("");
  const [member, setMember] = useState<Member | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [contributions, setContributions] = useState<CategoryAmount[]>([emptyLine()]);
  const [entryType, setEntryType] = useState("envelope");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Next auto-assigned book receipt number (read-only hint, still overridable).
  const { data: nextReceiptData } = useQuery<NextReceiptNumberResult>(
    GET_NEXT_RECEIPT_NUMBER,
    { fetchPolicy: "cache-and-network" }
  );
  const nextReceiptHint = nextReceiptData?.nextReceiptNumber?.nextReceiptNumber || "";

  const [lookupMember] = useMutation<LookupMemberResult>(LOOKUP_MEMBER_BY_PHONE);
  const [createContribution] = useMutation<CreateMultiContributionResult>(
    CREATE_MANUAL_MULTI_CONTRIBUTION
  );

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

  const toggleWalkIn = (next: boolean) => {
    setWalkIn(next);
    setError("");
    // Clear the identity inputs for the other mode to avoid stale values.
    if (next) {
      setPhoneNumber("");
      setMember(null);
      setIsGuest(false);
    } else {
      setGiverName("");
    }
  };

  const resetForm = () => {
    setWalkIn(false);
    setPhoneNumber("");
    setGiverName("");
    setMember(null);
    setIsGuest(false);
    setContributions([emptyLine()]);
    setReceiptNumber("");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Identity validation
    if (walkIn) {
      if (!giverName.trim()) {
        setError("Giver name is required for a walk-in entry");
        return;
      }
    } else if (!phoneNumber.trim()) {
      setError("Phone number is required");
      return;
    }

    // Line-item validation
    const cleaned = contributions.filter((c) => c.categoryId || c.amount);
    if (cleaned.length === 0) {
      setError("Add at least one department and amount");
      return;
    }
    for (const line of cleaned) {
      if (!line.categoryId) {
        setError("Please select a department for every line");
        return;
      }
      if (!line.amount || parseFloat(line.amount) < 1) {
        setError("Each amount must be at least KES 1.00");
        return;
      }
    }

    setSubmitting(true);

    try {
      const { data } = await createContribution({
        variables: {
          phoneNumber: walkIn ? null : phoneNumber.trim(),
          giverName: walkIn ? giverName.trim() : null,
          contributions: cleaned.map((c) => ({
            categoryId: c.categoryId,
            amount: c.amount,
            purposeId: c.purposeId || null,
            memberIdentifier: c.memberIdentifier || null,
          })),
          entryType,
          receiptNumber: receiptNumber.trim() || null,
          notes: notes.trim() || null,
        },
      });

      if (data?.createManualMultiContribution?.success) {
        setSuccess(true);
        resetForm();
      } else {
        setError(
          data?.createManualMultiContribution?.message ||
            "Failed to create contribution"
        );
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
                {walkIn
                  ? "Enter the giver's name for this walk-in contribution"
                  : "Enter phone number to identify the contributor"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Walk-in toggle */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="walk-in">Walk-in / no phone</Label>
                  <p className="text-xs text-muted-foreground">
                    Record a giver who has no phone number on file. No SMS
                    receipt is sent.
                  </p>
                </div>
                <Switch
                  id="walk-in"
                  checked={walkIn}
                  onCheckedChange={toggleWalkIn}
                />
              </div>

              {walkIn ? (
                <div className="space-y-2">
                  <Label htmlFor="giver-name">Giver Name *</Label>
                  <Input
                    id="giver-name"
                    type="text"
                    placeholder="e.g. Visitor - John"
                    value={giverName}
                    onChange={(e) => setGiverName(e.target.value)}
                  />
                </div>
              ) : (
                <>
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
                        Search
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
                        {/* Ticket 11: show the actual name when we have one */}
                        {member.fullName || (isGuest ? "Guest" : "Member Found")}
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
                              This contributor is not yet a full member. You can
                              update their details later.
                            </p>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {phoneNumber && !member && isGuest && (
                    <Alert>
                      <UserX className="h-4 w-4" />
                      <AlertTitle>New contributor</AlertTitle>
                      <AlertDescription>
                        This phone number is not registered. A new contributor
                        record will be created.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Contribution Details */}
          <Card>
            <CardHeader>
              <CardTitle>Contribution Details</CardTitle>
              <CardDescription>
                Add one or more departments. Each line can have its own purpose.
              </CardDescription>
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

              {/* Line items (department / purpose / amount) */}
              <div className="space-y-2">
                <Label>Departments *</Label>
                <MultiCategorySelector
                  contributions={contributions}
                  onChange={setContributions}
                  phoneNumber={walkIn ? undefined : phoneNumber}
                />
              </div>

              {/* Receipt Number */}
              <div className="space-y-2">
                <Label htmlFor="receipt">Receipt Number (Optional)</Label>
                <Input
                  id="receipt"
                  type="text"
                  placeholder={nextReceiptHint || "ENV001"}
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                />
                {nextReceiptHint && (
                  <p className="text-xs text-muted-foreground">
                    Next auto-assigned number:{" "}
                    <span className="font-medium">{nextReceiptHint}</span>. Leave
                    blank to use it, or type your own to override.
                  </p>
                )}
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
          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
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
              <Button type="button" variant="outline" onClick={handleAddAnother} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Another
              </Button>
            )}

            <Link href="/admin/contributions">
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                View All Contributions
              </Button>
            </Link>

            <Link href="/admin/receipt-settings">
              <Button type="button" variant="ghost" className="w-full sm:w-auto">
                <Settings className="h-4 w-4 mr-2" />
                Receipt Book Settings
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
