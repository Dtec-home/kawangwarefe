/**
 * MemberPhonesPanel (MP-2): a member's numbers with add / make primary /
 * remove, wired to the API. "self" is the member's own profile (adding needs a
 * code sent to the new number); "admin" is the members page (no code).
 */

"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ADMIN_ADD_MEMBER_PHONE,
  CONFIRM_ADD_PHONE,
  MEMBER_PHONES,
  REMOVE_MEMBER_PHONE,
  REQUEST_ADD_PHONE,
  SET_PRIMARY_PHONE,
} from "@/lib/graphql/member-phones";
import { AddPhoneForm } from "./add-phone-form";
import { PhoneList } from "./phone-list";
import type { MemberPhone, PhoneResult } from "./types";

type Answer = Record<string, PhoneResult>;

export function MemberPhonesPanel({ memberId, mode }: { memberId: string; mode: "self" | "admin" }) {
  const { data, loading, refetch } = useQuery<{ memberPhones: MemberPhone[] }>(MEMBER_PHONES, {
    variables: { memberId },
    fetchPolicy: "network-only",
  });
  const [requestAdd] = useMutation<Answer>(REQUEST_ADD_PHONE);
  const [confirmAdd] = useMutation<Answer>(CONFIRM_ADD_PHONE);
  const [adminAdd] = useMutation<Answer>(ADMIN_ADD_MEMBER_PHONE);
  const [removePhone] = useMutation<Answer>(REMOVE_MEMBER_PHONE);
  const [setPrimary] = useMutation<Answer>(SET_PRIMARY_PHONE);
  const [busyId, setBusyId] = useState<string | null>(null);

  const call = async (run: () => Promise<{ data?: Answer | null }>, field: string): Promise<PhoneResult> => {
    const { data: answered } = await run();
    const result = answered?.[field] ?? { success: false, message: "No answer from the server" };
    if (result.success && field !== "requestAddPhone") {
      toast.success(result.message);
      await refetch();
    }
    return result;
  };

  const change = async (id: string, run: () => Promise<{ data?: Answer | null }>, field: string) => {
    setBusyId(id);
    try {
      const result = await call(run, field);
      if (!result.success) toast.error(result.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading && !data) return <Skeleton className="h-24 w-full" />;

  return (
    <div className="space-y-4">
      <PhoneList
        phones={data?.memberPhones ?? []}
        busyId={busyId}
        onMakePrimary={(id) => change(id, () => setPrimary({ variables: { phoneId: id } }), "setPrimaryPhone")}
        onRemove={(id) => change(id, () => removePhone({ variables: { phoneId: id } }), "removeMemberPhone")}
      />
      {mode === "self" ? (
        <AddPhoneForm
          mode="otp"
          memberId={memberId}
          onRequest={(phoneNumber, label) => call(() => requestAdd({ variables: { phoneNumber, label } }), "requestAddPhone")}
          onConfirm={(phoneNumber, otpCode, label) =>
            call(() => confirmAdd({ variables: { phoneNumber, otpCode, label } }), "confirmAddPhone")}
          onAdded={() => undefined}
        />
      ) : (
        <AddPhoneForm
          mode="admin"
          memberId={memberId}
          onAdminAdd={(phoneNumber, label) =>
            call(() => adminAdd({ variables: { memberId, phoneNumber, label } }), "adminAddMemberPhone")}
          onAdded={() => undefined}
        />
      )}
    </div>
  );
}
