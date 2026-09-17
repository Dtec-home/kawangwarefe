/**
 * Manual Contribution Entry Page
 * Sprint 4: Admin Dashboard - Manual Contribution Entry
 *
 * Allows admins to manually enter contributions for envelope/cash donations.
 * Supports multiple line items (Ticket 6), walk-in givers with no phone
 * (Ticket 7). Every saved entry gets a system receipt number (YYYYMMDD-NNNN,
 * T1.8); the typed field only records an old paper-book number. Entries are
 * always for today unless an admin has opened a catch-up window (T2.8).
 */

"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { CREATE_MANUAL_MULTI_CONTRIBUTION } from "@/lib/graphql/manual-contribution-mutations";
import { useActiveEntryUnlocks } from "@/lib/hooks/use-active-entry-unlocks";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { PageHeader } from "@/components/ui/page-header";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import {
  ContributionLinesForm,
  emptyContributionLine,
  toManualCategoryInputs,
  validateContributionLines,
  type CategoryAmount,
} from "@/components/contributions/contribution-lines-form";
import {
  GiverIdentityFields,
  useGiverLookup,
  type LookedUpMember,
} from "@/components/contributions/giver-lookup";
import {
  RECORD_FOR_TODAY as TODAY,
  RecordingForField,
  effectiveRecordFor as resolveRecordFor,
  transactionDateVariables,
} from "@/components/contributions/recording-for-field";
import { ReplayTourButton } from "@/components/help/ReplayTourButton";
import { useTour } from "@/hooks/use-tour";
import { ADMIN_MANUAL_ENTRY_TOUR_CONFIG } from "@/lib/tours/configs/admin-manual-entry";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Save,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  UserCheck,
  UserX,
  Plus,
  Info,
} from "lucide-react";
import Link from "next/link";

type Member = LookedUpMember;

interface CreateMultiContributionResult {
  createManualMultiContribution: {
    success: boolean;
    message: string;
    /** System receipt number (YYYYMMDD-NNNN) */
    receiptNumber?: string | null;
  };
}

function ManualContributionPageContent() {
  const [walkIn, setWalkIn] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [giverName, setGiverName] = useState("");
  const [member, setMember] = useState<Member | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [contributions, setContributions] = useState<CategoryAmount[]>([emptyContributionLine()]);
  const [entryType, setEntryType] = useState("envelope");
  const [oldBookNumber, setOldBookNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [recordFor, setRecordFor] = useState<string>(TODAY);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [issuedReceipt, setIssuedReceipt] = useState<string | null>(null);
  const [error, setError] = useState("");

  const { start: startTour, isReady: isTourReady } = useTour({
    tourKey: "admin_manual_entry_v1",
    steps: ADMIN_MANUAL_ENTRY_TOUR_CONFIG.steps || [],
    autoStart: false,
  });

  // No backdating: a past date is only offered while a catch-up window is open.
  const { unlockDates, hasActiveUnlocks } = useActiveEntryUnlocks({ pollInterval: 60_000 });
  // Fall back to today if the chosen window has since closed.
  const effectiveRecordFor = hasActiveUnlocks ? resolveRecordFor(recordFor, unlockDates) : TODAY;

  const { lookup: lookupGiver } = useGiverLookup();
  const [createContribution] = useMutation<CreateMultiContributionResult>(
    CREATE_MANUAL_MULTI_CONTRIBUTION
  );

  const handlePhoneNumberLookup = async () => {
    if (!phoneNumber.trim()) return;

    try {
      const result = await lookupGiver(phoneNumber);
      if (result) {
        if (result.found && result.member) {
          setMember(result.member);
          setIsGuest(result.member.isGuest);
        } else {
          setMember(null);
          setIsGuest(true);
        }
      }
    } catch (err) {
      setError((err instanceof Error && err.message) || "Error looking up member");
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
    setContributions([emptyContributionLine()]);
    setOldBookNumber("");
    setNotes("");
    setRecordFor(TODAY);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIssuedReceipt(null);

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
    const validation = validateContributionLines(contributions);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    const cleaned = validation.lines;

    setSubmitting(true);

    try {
      const { data } = await createContribution({
        variables: {
          phoneNumber: walkIn ? null : phoneNumber.trim(),
          giverName: walkIn ? giverName.trim() : null,
          contributions: toManualCategoryInputs(cleaned),
          entryType,
          receiptNumber: oldBookNumber.trim() || null,
          // Omitted for today; the backend refuses other dates without a window.
          ...transactionDateVariables(effectiveRecordFor),
          notes: notes.trim() || null,
        },
      });

      if (data?.createManualMultiContribution?.success) {
        const number = data.createManualMultiContribution.receiptNumber ?? null;
        setSuccess(true);
        setIssuedReceipt(number);
        toast.success(number ? `Receipt ${number} issued` : "Contribution recorded");
        resetForm();
      } else {
        setError(
          data?.createManualMultiContribution?.message ||
            "Failed to create contribution"
        );
      }
    } catch (err) {
      setError((err instanceof Error && err.message) || "Error creating contribution");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    setSuccess(false);
    setIssuedReceipt(null);
    setError("");
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Page Header */}
        <div className="flex items-center gap-2" data-tour="manual-entry-header">
          <Link href="/admin/contributions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <PageHeader
            title="Manual Contribution Entry"
            description="Record contributions from envelopes, cash, or manual entries"
            className="flex-1"
            actions={<ReplayTourButton onClick={() => startTour()} disabled={!isTourReady} />}
          />
        </div>

        {/* Success Message */}
        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Contribution Recorded</AlertTitle>
            <AlertDescription>
              {issuedReceipt ? (
                <span>
                  Receipt number{" "}
                  <Link
                    href={`/receipts/${encodeURIComponent(issuedReceipt)}`}
                    className="font-mono text-base font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    {issuedReceipt}
                  </Link>
                  . Write this on the envelope or give it to the giver.
                </span>
              ) : (
                "The contribution has been successfully recorded."
              )}
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
          <Card data-tour="manual-entry-identity">
            <CardHeader>
              <CardTitle>Member Information</CardTitle>
              <CardDescription>
                {walkIn
                  ? "Enter the giver's name for this walk-in contribution"
                  : "Enter phone number to identify the contributor"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <GiverIdentityFields
                walkIn={walkIn}
                onWalkInChange={toggleWalkIn}
                phoneNumber={phoneNumber}
                onPhoneNumberChange={setPhoneNumber}
                giverName={giverName}
                onGiverNameChange={setGiverName}
                onLookup={handlePhoneNumberLookup}
              >
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
                          <p className="text-sm text-warning">
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
              </GiverIdentityFields>
            </CardContent>
          </Card>

          {/* Contribution Details */}
          <Card data-tour="manual-entry-details">
            <CardHeader>
              <CardTitle>Contribution Details</CardTitle>
              <CardDescription>
                Add one or more departments. Each line can have its own purpose.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recording date: today, or an open catch-up window (T2.8) */}
              <RecordingForField
                value={effectiveRecordFor}
                onChange={setRecordFor}
                unlockDates={unlockDates}
                hasActiveUnlocks={hasActiveUnlocks}
              />

              {/* Entry Type */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="entryType">Entry Type</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="What does each entry type mean?"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-64">
                        &ldquo;Local Evangelism/Loose Money&rdquo; is the display
                        label for the &ldquo;cash&rdquo; entry type. &ldquo;Manual
                        Entry&rdquo; is a catch-all for any other manually recorded
                        contribution.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
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
              <ContributionLinesForm
                lines={contributions}
                onChange={setContributions}
                phoneNumber={walkIn ? undefined : phoneNumber}
              />

              {/* Old paper-book number — the system issues the real receipt */}
              <div className="space-y-2" data-tour="manual-entry-receipt">
                <Label htmlFor="receipt">Old book receipt no. (optional)</Label>
                <Input
                  id="receipt"
                  type="text"
                  placeholder="e.g. 1043"
                  value={oldBookNumber}
                  onChange={(e) => setOldBookNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  A receipt number is issued automatically when you save. Only fill
                  this in if a paper receipt book was also used.
                </p>
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
          <div className="flex flex-col sm:flex-row gap-3" data-tour="manual-entry-actions">
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
