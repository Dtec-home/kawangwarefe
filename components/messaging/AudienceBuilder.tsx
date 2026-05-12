"use client";

/**
 * AudienceBuilder — structured audience picker.
 *
 * Composed of focused sub-components, each with a single concern.
 * Calls onFilterChange whenever the filter changes so the parent can
 * pass toJson() into previewCampaign / launchCampaign.
 */

import { useEffect, useRef, useState } from "react";
import { useLazyQuery, useQuery } from "@apollo/client/react";
import { X, Search, Users, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  GET_AVAILABLE_DEPARTMENTS,
  GET_AVAILABLE_GROUPS,
  MEMBER_SEARCH,
} from "@/lib/graphql/messaging-mutations";
import type { AudienceFilter } from "@/lib/hooks/use-audience-filter";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Opt { id: string; name: string; code?: string }
interface MemberOpt { id: string; fullName: string; phoneNumber: string; memberNumber: string }

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "treasurer", label: "Treasurer" },
  { value: "pastor", label: "Pastor" },
  { value: "department_admin", label: "Dept Admin" },
  { value: "group_admin", label: "Group Admin" },
  { value: "member", label: "Member" },
];

// Simple client-side format check (backend normalises the actual value)
const PHONE_RE = /^(\+?254|0)[17][0-9]{8}$/;

function parsePhones(raw: string): { valid: string[]; invalid: number } {
  const entries = raw.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
  const seen = new Set<string>();
  const valid: string[] = [];
  let invalid = 0;
  for (const e of entries) {
    if (PHONE_RE.test(e)) {
      if (!seen.has(e)) { seen.add(e); valid.push(e); }
    } else {
      invalid++;
    }
  }
  return { valid, invalid };
}

// ─── MultiCheckList ───────────────────────────────────────────────────────────

function MultiCheckList({
  label, options, selected, onChange,
}: {
  label: string; options: Opt[]; selected: string[]; onChange: (ids: string[]) => void;
}) {
  if (!options.length) return null;
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {options.map(o => (
          <label key={o.id} className="flex items-center gap-1.5 cursor-pointer text-sm">
            <Checkbox checked={selected.includes(o.id)} onCheckedChange={() => toggle(o.id)} />
            {o.name}
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── MemberTypeahead ─────────────────────────────────────────────────────────

function MemberTypeahead({
  selected, onChange,
}: {
  selected: MemberOpt[]; onChange: (members: MemberOpt[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [search, { data, loading }] = useLazyQuery<{ memberSearch: MemberOpt[] }>(MEMBER_SEARCH);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInput = (val: string) => {
    setQuery(val);
    if (debounce.current) clearTimeout(debounce.current);
    if (val.length < 2) { setOpen(false); return; }
    debounce.current = setTimeout(() => {
      search({ variables: { query: val, limit: 10 } });
      setOpen(true);
    }, 300);
  };

  const pick = (m: MemberOpt) => {
    if (!selected.find(s => s.id === m.id)) onChange([...selected, m]);
    setQuery(""); setOpen(false);
  };

  const remove = (id: string) => onChange(selected.filter(m => m.id !== id));
  const results = data?.memberSearch ?? [];

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Specific Members
      </p>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {selected.map(m => (
            <Badge key={m.id} variant="secondary" className="gap-1">
              {m.fullName}
              <button onClick={() => remove(m.id)} className="ml-0.5 hover:text-destructive" aria-label={`Remove ${m.fullName}`}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone…"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="pl-8"
        />
        {open && results.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md text-sm">
            {results.map(m => (
              <li key={m.id}>
                <button
                  className="w-full text-left px-3 py-2 hover:bg-muted flex justify-between"
                  onMouseDown={() => pick(m)}
                >
                  <span>{m.fullName}</span>
                  <span className="text-muted-foreground text-xs">{m.phoneNumber}</span>
                </button>
              </li>
            ))}
            {loading && <li className="px-3 py-2 text-muted-foreground text-xs">Searching…</li>}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── ExternalNumbersInput ─────────────────────────────────────────────────────

function ExternalNumbersInput({
  onChange,
}: {
  onChange: (phones: string[]) => void;
}) {
  const [raw, setRaw] = useState("");
  const [stats, setStats] = useState({ valid: 0, invalid: 0 });

  const handleChange = (value: string) => {
    setRaw(value);
    const { valid, invalid } = parsePhones(value);
    setStats({ valid: valid.length, invalid });
    onChange(valid);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          External Phone Numbers
        </p>
        <span className="text-xs text-muted-foreground">(not in member list)</span>
      </div>
      <Textarea
        placeholder={"Paste phone numbers — one per line or comma-separated\ne.g. 0712345678, 0723456789"}
        value={raw}
        onChange={e => handleChange(e.target.value)}
        rows={3}
        className="text-sm font-mono resize-none"
      />
      {(stats.valid > 0 || stats.invalid > 0) && (
        <div className="flex gap-3 text-xs">
          {stats.valid > 0 && (
            <span className="text-green-700 dark:text-green-400 font-medium">
              {stats.valid} valid number{stats.valid !== 1 ? "s" : ""}
            </span>
          )}
          {stats.invalid > 0 && (
            <span className="text-amber-600 dark:text-amber-400">
              {stats.invalid} unrecognised (will be skipped)
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── AudienceToggles ─────────────────────────────────────────────────────────

function AudienceToggles({
  includeGuests, includeMinors, onGuestsChange, onMinorsChange,
}: {
  includeGuests: boolean; includeMinors: boolean;
  onGuestsChange: (v: boolean) => void; onMinorsChange: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap gap-4">
      <label className="flex items-center gap-2 cursor-pointer text-sm">
        <Checkbox checked={includeGuests} onCheckedChange={v => onGuestsChange(!!v)} />
        Include guests
      </label>
      <label className="flex items-center gap-2 cursor-pointer text-sm">
        <Checkbox checked={includeMinors} onCheckedChange={v => onMinorsChange(!!v)} />
        Include minors
      </label>
    </div>
  );
}

// ─── AudienceBuilder (main export) ──────────────────────────────────────────

interface AudienceBuilderProps {
  filter: AudienceFilter;
  onDepartmentIdsChange: (ids: string[]) => void;
  onGroupIdsChange: (ids: string[]) => void;
  onRolesChange: (roles: string[]) => void;
  onMemberIdsChange: (ids: string[]) => void;
  onIncludeGuestsChange: (v: boolean) => void;
  onIncludeMinorsChange: (v: boolean) => void;
  onExtraPhoneNumbersChange: (phones: string[]) => void;
}

export function AudienceBuilder({
  filter,
  onDepartmentIdsChange,
  onGroupIdsChange,
  onRolesChange,
  onMemberIdsChange,
  onIncludeGuestsChange,
  onIncludeMinorsChange,
  onExtraPhoneNumbersChange,
}: AudienceBuilderProps) {
  const { data: deptData } = useQuery<{ availableDepartments: Opt[] }>(GET_AVAILABLE_DEPARTMENTS);
  const { data: groupData } = useQuery<{ availableGroups: Opt[] }>(GET_AVAILABLE_GROUPS);

  const departments = deptData?.availableDepartments ?? [];
  const groups = groupData?.availableGroups ?? [];

  const [selectedMembers, setSelectedMembers] = useState<MemberOpt[]>([]);
  const handleMembersChange = (members: MemberOpt[]) => {
    setSelectedMembers(members);
    onMemberIdsChange(members.map(m => m.id));
  };

  const hasSelection =
    filter.departmentIds.length > 0 ||
    filter.groupIds.length > 0 ||
    filter.roles.length > 0 ||
    filter.memberIds.length > 0 ||
    filter.extraPhoneNumbers.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Select Audience</span>
        {hasSelection && (
          <Badge variant="secondary" className="ml-auto">
            {filter.departmentIds.length + filter.groupIds.length +
              filter.roles.length + filter.memberIds.length +
              filter.extraPhoneNumbers.length} filter(s) active
          </Badge>
        )}
      </div>

      {departments.length > 0 && (
        <MultiCheckList label="Departments" options={departments} selected={filter.departmentIds} onChange={onDepartmentIdsChange} />
      )}

      {groups.length > 0 && (
        <MultiCheckList label="Groups" options={groups} selected={filter.groupIds} onChange={onGroupIdsChange} />
      )}

      <MultiCheckList
        label="By Role"
        options={ROLES.map(r => ({ id: r.value, name: r.label }))}
        selected={filter.roles}
        onChange={onRolesChange}
      />

      <MemberTypeahead selected={selectedMembers} onChange={handleMembersChange} />

      <AudienceToggles
        includeGuests={filter.includeGuests}
        includeMinors={filter.includeMinors}
        onGuestsChange={onIncludeGuestsChange}
        onMinorsChange={onIncludeMinorsChange}
      />

      <div className="border-t pt-4">
        <ExternalNumbersInput onChange={onExtraPhoneNumbersChange} />
      </div>
    </div>
  );
}
