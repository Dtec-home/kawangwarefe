/**
 * Giver identity for a physically recorded gift (T2.5): look the giver up by
 * phone, or record a walk-in by name (no phone, no SMS).
 *
 * Shared by the admin manual-entry page and the recorder workspace. A pure
 * recorder only gets `giver { id displayName }` back from the lookup (RR-3);
 * staff also get the full `member`.
 */

"use client";

import { useCallback } from "react";
import { useMutation } from "@apollo/client/react";
import { Search } from "lucide-react";
import { LOOKUP_MEMBER_BY_PHONE } from "@/lib/graphql/manual-contribution-mutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export interface LookedUpMember {
  id: string;
  fullName: string;
  phoneNumber: string;
  memberNumber: string | null;
  isGuest: boolean;
}

interface LookupMemberResult {
  lookupMemberByPhone: {
    success?: boolean;
    found: boolean;
    message?: string;
    isGuest?: boolean;
    member?: LookedUpMember | null;
    giver?: { id: string; displayName: string } | null;
  };
}

export interface GiverLookupResult {
  found: boolean;
  /** Name to confirm with the giver (never more for a pure recorder) */
  displayName: string | null;
  /** Full member record — staff only */
  member: LookedUpMember | null;
  isGuest: boolean;
}

/** Phone lookup; resolves null for a blank phone. Errors propagate. */
export function useGiverLookup() {
  const [lookupMember, { loading }] = useMutation<LookupMemberResult>(LOOKUP_MEMBER_BY_PHONE);

  const lookup = useCallback(
    async (phoneNumber: string): Promise<GiverLookupResult | null> => {
      const phone = phoneNumber.trim();
      if (!phone) return null;
      const { data } = await lookupMember({ variables: { phoneNumber: phone } });
      const result = data?.lookupMemberByPhone;
      if (!result) return null;
      if (result.success === false && result.message && !result.found) {
        throw new Error(result.message);
      }
      const member = result.found ? result.member ?? null : null;
      return {
        found: !!result.found,
        displayName: result.giver?.displayName ?? member?.fullName ?? null,
        member,
        isGuest: member ? member.isGuest : !result.found,
      };
    },
    [lookupMember]
  );

  return { lookup, loading };
}

interface GiverIdentityFieldsProps {
  walkIn: boolean;
  onWalkInChange: (walkIn: boolean) => void;
  phoneNumber: string;
  onPhoneNumberChange: (phone: string) => void;
  giverName: string;
  onGiverNameChange: (name: string) => void;
  onLookup: () => void;
  lookupLoading?: boolean;
  /** Lookup result area, shown under the phone field */
  children?: React.ReactNode;
}

export function GiverIdentityFields({
  walkIn,
  onWalkInChange,
  phoneNumber,
  onPhoneNumberChange,
  giverName,
  onGiverNameChange,
  onLookup,
  lookupLoading = false,
  children,
}: GiverIdentityFieldsProps) {
  return (
    <div className="space-y-4">
      {/* Walk-in toggle */}
      <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="walk-in">Walk-in / no phone</Label>
          <p className="text-xs text-muted-foreground">
            Record a giver who has no phone number on file. No SMS receipt is sent.
          </p>
        </div>
        <Switch id="walk-in" checked={walkIn} onCheckedChange={onWalkInChange} />
      </div>

      {walkIn ? (
        <div className="space-y-2">
          <Label htmlFor="giver-name">Giver Name *</Label>
          <Input
            id="giver-name"
            type="text"
            placeholder="e.g. Visitor - John"
            autoComplete="off"
            value={giverName}
            onChange={(e) => onGiverNameChange(e.target.value)}
          />
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <div className="flex-1 min-w-0">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="off"
                placeholder="0712345678 or 254712345678"
                value={phoneNumber}
                onChange={(e) => onPhoneNumberChange(e.target.value)}
                onBlur={onLookup}
              />
            </div>
            <div className="flex items-end">
              <Button type="button" variant="outline" onClick={onLookup} disabled={lookupLoading}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
          {children}
        </>
      )}
    </div>
  );
}
