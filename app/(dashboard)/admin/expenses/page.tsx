/**
 * Admin Expenses Page
 * Sprint: Expenses & UX (W1.4 / requisition rework)
 *
 * Requisition + four-eyes expense workflow:
 *  - Requesters: department (category) admins (for their own funds) AND
 *    treasurer/admin raise expense requests (status `pending` = "Requested").
 *  - Approval: treasurer/admin only, and the approver must NOT be the
 *    requester (four-eyes). Enforced server-side; surfaced via `canApprove`.
 *  - Mark paid: treasurer/admin, on an approved expense (`canMarkPaid`).
 *  - Void/cancel: treasurer/admin (any non-paid), or the requester may cancel
 *    their own pending request.
 *
 * Row actions are driven by per-expense booleans (`canApprove`, `canMarkPaid`,
 * `requestedByMe`) rather than by guessing the viewer's role.
 */

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  GET_EXPENSES,
  CREATE_EXPENSE,
  UPDATE_EXPENSE,
  APPROVE_EXPENSE,
  MARK_EXPENSE_PAID,
  VOID_EXPENSE,
} from "@/lib/graphql/expenses";
import { GET_CONTRIBUTION_CATEGORIES, GET_DEPARTMENT_PURPOSES } from "@/lib/graphql/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge, statusToVariant, type StatusVariant } from "@/components/ui/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { useUserRole } from "@/lib/hooks/use-user-role";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty } from "@/components/ui/empty";
import { PageHeader } from "@/components/ui/page-header";
import { Filter, Plus, CheckCircle, XCircle, Banknote, Pencil, Receipt } from "lucide-react";
import { toast } from "sonner";

interface Expense {
  id: string;
  amount: string;
  expenseDate: string | null;
  payee: string;
  description: string | null;
  paymentMethod: string | null;
  referenceNumber: string | null;
  status: string;
  category: { id: string; name: string } | null;
  purpose: { id: string; name: string } | null;
  recordedBy: string | null;
  approvedBy: string | null;
  paidBy: string | null;
  voidReason: string;
  requestedByMe: boolean;
  canApprove: boolean;
  canMarkPaid: boolean;
  attachmentUrl: string | null;
  createdAt: string | null;
}

interface ExpensesData {
  expenses: Expense[];
}

interface Category {
  id: string;
  name: string;
  code: string;
}

interface CategoriesData {
  contributionCategories: Category[];
}

interface Purpose {
  id: string;
  name: string;
  code: string;
}

interface PurposesData {
  departmentPurposes: Purpose[];
}

interface MutationResponse {
  success: boolean;
  message: string;
}

interface CreateExpenseData {
  createExpense: MutationResponse;
}
interface UpdateExpenseData {
  updateExpense: MutationResponse;
}
interface ApproveExpenseData {
  approveExpense: MutationResponse;
}
interface MarkPaidData {
  markExpensePaid: MutationResponse;
}
interface VoidExpenseData {
  voidExpense: MutationResponse;
}

const PAYMENT_METHODS = [
  { value: "mpesa", label: "M-Pesa" },
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

/** Human label for a workflow status. */
function getStatusLabel(status: string) {
  switch (status) {
    case "pending":
      return "Requested";
    case "approved":
      return "Approved";
    case "paid":
      return "Paid";
    case "rejected":
    case "voided":
      return "Voided";
    default:
      return status;
  }
}

/** Map a workflow status to a StatusBadge variant. */
function getStatusVariant(status: string): StatusVariant {
  // "voided" is not in the shared map; treat it like a rejected/destructive state.
  if (status === "voided") return "destructive";
  return statusToVariant(status);
}

/**
 * Dialog for raising a new expense request against a fund.
 */
function RequestExpenseDialog({
  open,
  onOpenChange,
  categories,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onSaved: () => void;
}) {
  const [categoryId, setCategoryId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [expenseDate, setExpenseDate] = useState<string>("");
  const [payee, setPayee] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [purposeId, setPurposeId] = useState<string>("none");
  const [attachmentUrl, setAttachmentUrl] = useState<string>("");
  // "Simple recording": treasurers/admins can log already-spent money directly,
  // skipping the request→approve step. Hidden from department admins.
  const { isStaff } = useUserRole();
  const [autoApprove, setAutoApprove] = useState<boolean>(false);

  const { data: purposesData } = useQuery<PurposesData>(GET_DEPARTMENT_PURPOSES, {
    variables: { categoryId: categoryId || undefined, isActive: true },
    skip: !categoryId,
  });
  const purposes = purposesData?.departmentPurposes || [];

  const [createExpense, { loading }] = useMutation<CreateExpenseData>(CREATE_EXPENSE);

  const reset = () => {
    setCategoryId("");
    setAmount("");
    setExpenseDate("");
    setPayee("");
    setDescription("");
    setPaymentMethod("cash");
    setReferenceNumber("");
    setPurposeId("none");
    setAttachmentUrl("");
    setAutoApprove(false);
  };

  const handleSave = async () => {
    if (!categoryId) {
      toast.error("Fund is required");
      return;
    }
    const parsedAmount = Number.parseFloat(amount);
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!expenseDate) {
      toast.error("Expense date is required");
      return;
    }
    if (!payee.trim()) {
      toast.error("Payee is required");
      return;
    }

    try {
      const { data } = await createExpense({
        variables: {
          categoryId,
          amount: parsedAmount.toFixed(2),
          expenseDate,
          payee: payee.trim(),
          description: description.trim() || null,
          paymentMethod,
          referenceNumber: referenceNumber.trim() || null,
          purposeId: purposeId === "none" ? null : purposeId,
          attachmentUrl: attachmentUrl.trim() || null,
          autoApprove: isStaff ? autoApprove : false,
        },
      });
      if (data?.createExpense.success) {
        toast.success(data.createExpense.message || "Expense request submitted");
        reset();
        onSaved();
        onOpenChange(false);
      } else {
        toast.error(data?.createExpense.message || "Failed to submit request");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit request");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{autoApprove ? "Record Expense" : "New Expense Request"}</DialogTitle>
          <DialogDescription>
            {autoApprove
              ? "Record money already paid out of a fund. It is approved immediately and deducted from the fund's balance now."
              : "Request money to be paid out of a fund. The request must be approved by a treasurer or admin (other than you) before it can be paid; it is deducted from the fund's balance once approved."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exp-fund">Fund *</Label>
            <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setPurposeId("none"); }}>
              <SelectTrigger id="exp-fund">
                <SelectValue placeholder="Select fund" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exp-amount">Amount (KES) *</Label>
              <Input
                id="exp-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-date">Expense Date *</Label>
              <Input
                id="exp-date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exp-payee">Payee *</Label>
            <Input
              id="exp-payee"
              placeholder="Who is to be paid"
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exp-description">Description</Label>
            <Textarea
              id="exp-description"
              placeholder="What is this expense for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exp-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="exp-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp-ref">Reference Number</Label>
              <Input
                id="exp-ref"
                placeholder="e.g. M-Pesa code / cheque #"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exp-purpose">Purpose (optional)</Label>
            <Select value={purposeId} onValueChange={setPurposeId} disabled={!categoryId || purposes.length === 0}>
              <SelectTrigger id="exp-purpose">
                <SelectValue placeholder={categoryId ? "No specific purpose" : "Select fund first"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific purpose</SelectItem>
                {purposes.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exp-attachment">Attachment URL (optional)</Label>
            <Input
              id="exp-attachment"
              placeholder="https://... (receipt/voucher)"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
            />
          </div>

          {isStaff && (
            <div className="flex items-start gap-3 rounded-md border border-border bg-muted/40 p-3">
              <Checkbox
                id="exp-auto-approve"
                checked={autoApprove}
                onCheckedChange={(v) => setAutoApprove(v === true)}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <Label htmlFor="exp-auto-approve" className="cursor-pointer">
                  Record as already approved (no approval needed)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Use this to log money that has already been spent. Skips the
                  four-eyes approval step and deducts from the balance immediately.
                </p>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading
              ? "Saving..."
              : autoApprove
                ? "Record Expense"
                : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Dialog for editing a pending expense request. The fund cannot be changed
 * (an expense can never be moved between funds).
 */
function EditExpenseDialog({
  expense,
  open,
  onOpenChange,
  onSaved,
}: {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState<string>("");
  const [expenseDate, setExpenseDate] = useState<string>("");
  const [payee, setPayee] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [purposeId, setPurposeId] = useState<string>("none");
  const [attachmentUrl, setAttachmentUrl] = useState<string>("");
  const [hydratedFor, setHydratedFor] = useState<string>("");

  // Hydrate the form whenever a new expense is opened for editing.
  if (expense && open && hydratedFor !== expense.id) {
    setAmount(expense.amount ?? "");
    setExpenseDate(expense.expenseDate ?? "");
    setPayee(expense.payee ?? "");
    setDescription(expense.description ?? "");
    setPaymentMethod(expense.paymentMethod || "cash");
    setReferenceNumber(expense.referenceNumber ?? "");
    setPurposeId(expense.purpose?.id ?? "none");
    setAttachmentUrl(expense.attachmentUrl ?? "");
    setHydratedFor(expense.id);
  }

  const { data: purposesData } = useQuery<PurposesData>(GET_DEPARTMENT_PURPOSES, {
    variables: { categoryId: expense?.category?.id || undefined, isActive: true },
    skip: !expense?.category?.id,
  });
  const purposes = purposesData?.departmentPurposes || [];

  const [updateExpense, { loading }] = useMutation<UpdateExpenseData>(UPDATE_EXPENSE);

  const handleSave = async () => {
    if (!expense) return;
    const parsedAmount = Number.parseFloat(amount);
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!expenseDate) {
      toast.error("Expense date is required");
      return;
    }
    if (!payee.trim()) {
      toast.error("Payee is required");
      return;
    }

    try {
      const { data } = await updateExpense({
        variables: {
          id: expense.id,
          amount: parsedAmount.toFixed(2),
          expenseDate,
          payee: payee.trim(),
          description: description.trim() || null,
          paymentMethod,
          referenceNumber: referenceNumber.trim() || null,
          purposeId: purposeId === "none" ? null : purposeId,
          attachmentUrl: attachmentUrl.trim() || null,
        },
      });
      if (data?.updateExpense.success) {
        toast.success(data.updateExpense.message || "Request updated");
        setHydratedFor("");
        onSaved();
        onOpenChange(false);
      } else {
        toast.error(data?.updateExpense.message || "Failed to update request");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update request");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setHydratedFor(""); onOpenChange(v); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Expense Request</DialogTitle>
          <DialogDescription>
            Update the details of this pending request. The fund cannot be changed.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Fund</Label>
            <Input value={expense?.category?.name || "—"} disabled readOnly />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount (KES) *</Label>
              <Input
                id="edit-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-date">Expense Date *</Label>
              <Input
                id="edit-date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-payee">Payee *</Label>
            <Input
              id="edit-payee"
              placeholder="Who is to be paid"
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              placeholder="What is this expense for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="edit-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-ref">Reference Number</Label>
              <Input
                id="edit-ref"
                placeholder="e.g. M-Pesa code / cheque #"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-purpose">Purpose (optional)</Label>
            <Select value={purposeId} onValueChange={setPurposeId} disabled={purposes.length === 0}>
              <SelectTrigger id="edit-purpose">
                <SelectValue placeholder="No specific purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific purpose</SelectItem>
                {purposes.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-attachment">Attachment URL (optional)</Label>
            <Input
              id="edit-attachment"
              placeholder="https://... (receipt/voucher)"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Dialog to capture a reason and void / cancel an expense.
 */
function VoidExpenseDialog({
  expense,
  isOwnRequest,
  open,
  onOpenChange,
  onSaved,
}: {
  expense: Expense | null;
  isOwnRequest: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [reason, setReason] = useState<string>("");
  const [voidExpense, { loading }] = useMutation<VoidExpenseData>(VOID_EXPENSE);

  const actionWord = isOwnRequest ? "Cancel" : "Void";

  const handleVoid = async () => {
    if (!expense) return;
    if (!reason.trim()) {
      toast.error("A reason is required");
      return;
    }
    try {
      const { data } = await voidExpense({
        variables: { id: expense.id, reason: reason.trim() },
      });
      if (data?.voidExpense.success) {
        toast.success(data.voidExpense.message || `Request ${isOwnRequest ? "cancelled" : "voided"}`);
        setReason("");
        onSaved();
        onOpenChange(false);
      } else {
        toast.error(data?.voidExpense.message || `Failed to ${actionWord.toLowerCase()}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${actionWord.toLowerCase()}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setReason(""); onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isOwnRequest ? "Cancel Request" : "Void Expense"}</DialogTitle>
          <DialogDescription>
            {isOwnRequest
              ? "Cancelling withdraws this request. Provide a reason for the audit trail."
              : "Voiding excludes this expense from the fund's balance. Provide a reason for the audit trail."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="void-reason">Reason *</Label>
          <Textarea
            id="void-reason"
            placeholder={isOwnRequest ? "Why are you cancelling this?" : "Why is this being voided?"}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Close
          </Button>
          <Button variant="destructive" onClick={handleVoid} disabled={loading}>
            {loading ? `${actionWord}...` : `${actionWord} ${isOwnRequest ? "Request" : "Expense"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ExpensesPage() {
  const { isStaff, isCategoryAdmin } = useUserRole();
  // Both staff (admin/treasurer) and department (category) admins may raise
  // expense requests. Per-row action visibility is driven by booleans below.
  const canRequest = isStaff || isCategoryAdmin;

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showRequestDialog, setShowRequestDialog] = useState<boolean>(false);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [voidTarget, setVoidTarget] = useState<Expense | null>(null);

  const { data: categoriesData } = useQuery<CategoriesData>(GET_CONTRIBUTION_CATEGORIES);
  const categories = categoriesData?.contributionCategories || [];

  const { data, loading, error, refetch } = useQuery<ExpensesData>(GET_EXPENSES, {
    variables: {
      categoryId: categoryFilter === "all" ? null : categoryFilter,
      status: statusFilter === "all" ? null : statusFilter,
      startDate: startDate || null,
      endDate: endDate || null,
      limit: 100,
      offset: 0,
    },
  });

  const expenses = data?.expenses || [];

  const [approveExpense] = useMutation<ApproveExpenseData>(APPROVE_EXPENSE);
  const [markExpensePaid] = useMutation<MarkPaidData>(MARK_EXPENSE_PAID);

  const handleApprove = async (expense: Expense) => {
    try {
      const { data } = await approveExpense({ variables: { id: expense.id } });
      if (data?.approveExpense.success) {
        toast.success(data.approveExpense.message || "Expense approved");
        void refetch();
      } else {
        toast.error(data?.approveExpense.message || "Failed to approve");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve");
    }
  };

  const handleMarkPaid = async (expense: Expense) => {
    try {
      const { data } = await markExpensePaid({ variables: { id: expense.id } });
      if (data?.markExpensePaid.success) {
        toast.success(data.markExpensePaid.message || "Marked as paid");
        void refetch();
      } else {
        toast.error(data?.markExpensePaid.message || "Failed to mark paid");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark paid");
    }
  };

  // Per-row gating helpers (booleans-first; isStaff only used for void scope).
  const canEdit = (e: Expense) => e.status === "pending" && (isStaff || e.requestedByMe);
  const canCancelOwn = (e: Expense) => e.status === "pending" && e.requestedByMe;
  const canVoidAsStaff = (e: Expense) => isStaff && e.status !== "paid" && (e.status === "pending" || e.status === "approved");
  const hasAnyAction = (e: Expense) =>
    e.canApprove || e.canMarkPaid || canEdit(e) || canCancelOwn(e) || canVoidAsStaff(e);

  // Total disbursed = approved + paid (money committed out of funds).
  const totalOut = expenses
    .filter((e) => e.status === "approved" || e.status === "paid")
    .reduce((sum, e) => sum + Number.parseFloat(e.amount || "0"), 0);

  const activeFilterCount = [
    categoryFilter !== "all",
    statusFilter !== "all",
    startDate !== "",
    endDate !== "",
  ].filter(Boolean).length;

  // Whether the viewer is cancelling their own request vs voiding as staff.
  const voidIsOwnRequest = voidTarget ? voidTarget.requestedByMe && !isStaff : false;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Expenses"
          description="Request, approve and pay money out of church funds"
          actions={
            canRequest ? (
              <Button onClick={() => setShowRequestDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Request Expense
              </Button>
            ) : undefined
          }
        />

        {/* Summary card */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Approved + Paid (filtered)</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KES {totalOut.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{expenses.length} expense{expenses.length === 1 ? "" : "s"} shown</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-normal">
                  {activeFilterCount}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filter-fund">Fund</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger id="filter-fund">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Funds</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="filter-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Requested</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="rejected">Voided</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-start">From</Label>
                <Input
                  id="filter-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-end">To</Label>
                <Input
                  id="filter-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setCategoryFilter("all");
                  setStatusFilter("all");
                  setStartDate("");
                  setEndDate("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Expenses table */}
        <Card>
          <CardHeader>
            <CardTitle>All Expenses</CardTitle>
            <CardDescription>
              {expenses.length} expense{expenses.length === 1 ? "" : "s"} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            )}
            {error && (
              <div className="text-center py-8 text-destructive">
                Error loading expenses: {error.message}
              </div>
            )}
            {!loading && !error && expenses.length === 0 && (
              <Empty
                icon={Receipt}
                title="No expenses found"
                description="No expenses match the current filters."
                action={
                  canRequest ? (
                    <Button onClick={() => setShowRequestDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Request Expense
                    </Button>
                  ) : undefined
                }
              />
            )}

            {!loading && !error && expenses.length > 0 && (
              <>
                {/* Mobile card view */}
                <div className="space-y-3 md:hidden">
                  {expenses.map((e) => (
                    <div key={e.id} className="border border-border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">KES {Number.parseFloat(e.amount).toLocaleString()}</span>
                        <StatusBadge variant={getStatusVariant(e.status)}>{getStatusLabel(e.status)}</StatusBadge>
                      </div>
                      <div className="text-sm font-medium">{e.payee}</div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{e.category?.name || "—"}</span>
                        <span>
                          {e.expenseDate
                            ? new Date(e.expenseDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                            : "—"}
                        </span>
                      </div>
                      {e.description && <div className="text-xs text-muted-foreground">{e.description}</div>}
                      {(e.paymentMethod || e.referenceNumber) && (
                        <div className="text-xs text-muted-foreground">
                          {e.paymentMethod}{e.referenceNumber ? ` • ${e.referenceNumber}` : ""}
                        </div>
                      )}

                      {/* Accountability trail */}
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        {e.recordedBy && <div>Requested by {e.recordedBy}</div>}
                        {e.status === "approved" && e.approvedBy && <div>Approved by {e.approvedBy}</div>}
                        {e.status === "paid" && (
                          <>
                            {e.approvedBy && <div>Approved by {e.approvedBy}</div>}
                            {e.paidBy && <div>Paid by {e.paidBy}</div>}
                          </>
                        )}
                        {(e.status === "rejected" || e.status === "voided") && e.voidReason && (
                          <div className="text-destructive">Voided: {e.voidReason}</div>
                        )}
                      </div>

                      {hasAnyAction(e) && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {e.canApprove && (
                            <Button size="sm" onClick={() => handleApprove(e)}>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                          )}
                          {e.canMarkPaid && (
                            <Button size="sm" onClick={() => handleMarkPaid(e)}>
                              <Banknote className="h-3 w-3 mr-1" />
                              Mark Paid
                            </Button>
                          )}
                          {canEdit(e) && (
                            <Button size="sm" variant="outline" onClick={() => setEditTarget(e)}>
                              <Pencil className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          )}
                          {canCancelOwn(e) && !isStaff && (
                            <Button size="sm" variant="destructive" onClick={() => setVoidTarget(e)}>
                              <XCircle className="h-3 w-3 mr-1" />
                              Cancel request
                            </Button>
                          )}
                          {canVoidAsStaff(e) && (
                            <Button size="sm" variant="destructive" onClick={() => setVoidTarget(e)}>
                              <XCircle className="h-3 w-3 mr-1" />
                              Void
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop table view */}
                <div className="overflow-x-auto hidden md:block">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10 bg-card [&_th]:bg-card [&_tr]:shadow-[inset_0_-1px_0_0_var(--border)]">
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Date</th>
                        <th className="text-left p-3 font-medium">Fund</th>
                        <th className="text-left p-3 font-medium">Payee</th>
                        <th className="text-left p-3 font-medium">Purpose</th>
                        <th className="text-left p-3 font-medium">Method</th>
                        <th className="text-left p-3 font-medium">Reference</th>
                        <th className="text-left p-3 font-medium">Accountability</th>
                        <th className="text-right p-3 font-medium">Amount</th>
                        <th className="text-center p-3 font-medium">Status</th>
                        <th className="text-right p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((e) => (
                        <tr key={e.id} className="border-b hover:bg-muted/60">
                          <td className="p-3 text-sm">
                            {e.expenseDate
                              ? new Date(e.expenseDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                              : "—"}
                          </td>
                          <td className="p-3 text-sm">{e.category?.name || "—"}</td>
                          <td className="p-3 text-sm">
                            <div className="font-medium">{e.payee}</div>
                            {e.description && (
                              <div className="text-xs text-muted-foreground max-w-xs truncate">{e.description}</div>
                            )}
                          </td>
                          <td className="p-3 text-sm">{e.purpose?.name || "—"}</td>
                          <td className="p-3 text-sm capitalize">{e.paymentMethod || "—"}</td>
                          <td className="p-3 text-sm font-mono">
                            {e.attachmentUrl ? (
                              <a href={e.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-info hover:underline">
                                {e.referenceNumber || "View"}
                              </a>
                            ) : (
                              e.referenceNumber || "—"
                            )}
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">
                            <div className="space-y-0.5">
                              {e.recordedBy && <div>Req: {e.recordedBy}</div>}
                              {(e.status === "approved" || e.status === "paid") && e.approvedBy && (
                                <div>Appr: {e.approvedBy}</div>
                              )}
                              {e.status === "paid" && e.paidBy && <div>Paid: {e.paidBy}</div>}
                              {(e.status === "rejected" || e.status === "voided") && e.voidReason && (
                                <div className="text-destructive max-w-[12rem] truncate" title={e.voidReason}>
                                  Voided: {e.voidReason}
                                </div>
                              )}
                              {!e.recordedBy &&
                                !(e.status === "paid" && e.paidBy) &&
                                !((e.status === "approved" || e.status === "paid") && e.approvedBy) &&
                                !((e.status === "rejected" || e.status === "voided") && e.voidReason) && (
                                  <span>—</span>
                                )}
                            </div>
                          </td>
                          <td className="p-3 text-sm text-right font-semibold">
                            KES {Number.parseFloat(e.amount).toLocaleString()}
                          </td>
                          <td className="p-3 text-center">
                            <StatusBadge variant={getStatusVariant(e.status)}>{getStatusLabel(e.status)}</StatusBadge>
                          </td>
                          <td className="p-3 text-sm text-right">
                            {hasAnyAction(e) ? (
                              <div className="flex gap-2 justify-end flex-wrap">
                                {e.canApprove && (
                                  <Button size="sm" onClick={() => handleApprove(e)}>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approve
                                  </Button>
                                )}
                                {e.canMarkPaid && (
                                  <Button size="sm" onClick={() => handleMarkPaid(e)}>
                                    <Banknote className="h-3 w-3 mr-1" />
                                    Mark Paid
                                  </Button>
                                )}
                                {canEdit(e) && (
                                  <Button size="sm" variant="outline" onClick={() => setEditTarget(e)}>
                                    <Pencil className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                )}
                                {canCancelOwn(e) && !isStaff && (
                                  <Button size="sm" variant="destructive" onClick={() => setVoidTarget(e)}>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Cancel
                                  </Button>
                                )}
                                {canVoidAsStaff(e) && (
                                  <Button size="sm" variant="destructive" onClick={() => setVoidTarget(e)}>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Void
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <RequestExpenseDialog
        open={showRequestDialog}
        onOpenChange={setShowRequestDialog}
        categories={categories}
        onSaved={() => void refetch()}
      />
      <EditExpenseDialog
        expense={editTarget}
        open={editTarget !== null}
        onOpenChange={(v) => { if (!v) setEditTarget(null); }}
        onSaved={() => void refetch()}
      />
      <VoidExpenseDialog
        expense={voidTarget}
        isOwnRequest={voidIsOwnRequest}
        open={voidTarget !== null}
        onOpenChange={(v) => { if (!v) setVoidTarget(null); }}
        onSaved={() => void refetch()}
      />
    </AdminLayout>
  );
}
