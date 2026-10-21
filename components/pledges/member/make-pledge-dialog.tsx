/**
 * "Make a pledge": to a campaign taking pledges or to a department, with an
 * amount and an optional due date → createPledge (S3-UI-E, ticket 3.8).
 */

"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CREATE_PLEDGE,
  MY_PLEDGES,
  PLEDGE_TARGETS,
  type CreatePledgeData,
  type CreatePledgeVars,
  type PledgeTargetsData,
} from "@/lib/graphql/fundraising/member-pledges";
import { nairobiToday } from "@/lib/treasury/entry-dates";
import { cn } from "@/lib/utils";

import {
  emptyPledgeForm,
  toPledgeInput,
  validatePledgeForm,
  type PledgeFormErrors,
  type PledgeFormValues,
  type PledgeTargetKind,
} from "./pledge-form";

const FAILED = "Could not record the pledge";

interface MakePledgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MakePledgeDialog({ open, onOpenChange }: MakePledgeDialogProps) {
  const [values, setValues] = useState<PledgeFormValues>(emptyPledgeForm());
  const [errors, setErrors] = useState<PledgeFormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // publicCampaigns has no id, so keep it out of the shared cache (see
  // campaign-page-view.tsx).
  const targets = useQuery<PledgeTargetsData>(PLEDGE_TARGETS, {
    skip: !open,
    fetchPolicy: "no-cache",
    errorPolicy: "all",
  });
  const [createPledge, { loading }] = useMutation<CreatePledgeData, CreatePledgeVars>(CREATE_PLEDGE, {
    refetchQueries: [{ query: MY_PLEDGES }],
    awaitRefetchQueries: true,
  });

  const campaigns = (targets.data?.publicCampaigns ?? []).filter((c) => c.allowPledges && c.isAcceptingGifts);
  const departments = targets.data?.contributionCategories ?? [];
  const today = nairobiToday();

  const set = (patch: Partial<PledgeFormValues>) => setValues((v) => ({ ...v, ...patch }));

  const close = (next: boolean) => {
    if (!next) {
      setValues(emptyPledgeForm());
      setErrors({});
      setServerError(null);
    }
    onOpenChange(next);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validatePledgeForm(values, today);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setServerError(null);
    try {
      const { data } = await createPledge({ variables: { input: toPledgeInput(values) } });
      const result = data?.createPledge;
      if (result?.success) {
        toast.success(result.message || "Pledge recorded");
        close(false);
      } else {
        setServerError(result?.message || FAILED);
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : FAILED);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Make a pledge</DialogTitle>
          <DialogDescription>
            Promise an amount now and give it over time. We&apos;ll remind you by SMS before it is due.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate aria-label="Make a pledge">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Pledge to</legend>
            <div className="grid grid-cols-2 gap-2">
              <KindOption kind="campaign" label="A campaign" current={values.kind} onChange={(kind) => set({ kind })} />
              <KindOption kind="department" label="A department" current={values.kind} onChange={(kind) => set({ kind })} />
            </div>
          </fieldset>

          {values.kind === "campaign" ? (
            <div className="space-y-2">
              <Label htmlFor="pledge-campaign">Campaign</Label>
              <Select value={values.campaignId} onValueChange={(campaignId) => set({ campaignId })}>
                <SelectTrigger id="pledge-campaign" className="w-full" aria-invalid={errors.target ? true : undefined}>
                  <SelectValue placeholder={targets.loading ? "Loading campaigns…" : "Choose a campaign"} />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((c) => (
                    <SelectItem key={c.campaignId} value={c.campaignId}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!targets.loading && campaigns.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No campaign is taking pledges right now. You can pledge to a department instead.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="pledge-department">Department</Label>
              <Select value={values.categoryId} onValueChange={(categoryId) => set({ categoryId })}>
                <SelectTrigger id="pledge-department" className="w-full" aria-invalid={errors.target ? true : undefined}>
                  <SelectValue placeholder={targets.loading ? "Loading departments…" : "Choose a department"} />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {errors.target ? <p className="text-xs text-destructive">{errors.target}</p> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pledge-amount">
                Amount (KES)<span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id="pledge-amount"
                type="number"
                inputMode="decimal"
                min={1}
                step="any"
                placeholder="5000"
                value={values.amount}
                onChange={(e) => set({ amount: e.target.value })}
                aria-invalid={errors.amount ? true : undefined}
              />
              {errors.amount ? <p className="text-xs text-destructive">{errors.amount}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pledge-due-date">Due date (optional)</Label>
              <Input
                id="pledge-due-date"
                type="date"
                min={today}
                value={values.dueDate}
                onChange={(e) => set({ dueDate: e.target.value })}
                aria-invalid={errors.dueDate ? true : undefined}
              />
              {errors.dueDate ? <p className="text-xs text-destructive">{errors.dueDate}</p> : null}
            </div>
          </div>

          {serverError ? (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => close(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Pledge
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function KindOption({
  kind,
  label,
  current,
  onChange,
}: {
  kind: PledgeTargetKind;
  label: string;
  current: PledgeTargetKind;
  onChange: (kind: PledgeTargetKind) => void;
}) {
  const checked = kind === current;
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
        "has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
        checked ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"
      )}
    >
      <input
        type="radio"
        name="pledge-kind"
        value={kind}
        checked={checked}
        onChange={() => onChange(kind)}
        className="sr-only"
      />
      {label}
    </label>
  );
}
