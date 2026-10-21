/**
 * Filters of a pledge register: campaign, department, status and a search by
 * name or phone (Fundraising S3, lane S3-UI-F, ticket 3.11). The campaign and
 * department choices are left out when the register is for one campaign.
 */

"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { PLEDGE_STATUS_LABELS } from "./pledge-labels";
import { usePledgeScopeOptions } from "./use-pledge-scope-options";

export const ALL = "all";

export interface PledgeFilterValues {
  campaign: string;
  department: string;
  status: string;
  search: string;
}

export const NO_FILTERS: PledgeFilterValues = { campaign: ALL, department: ALL, status: ALL, search: "" };

interface PledgeFiltersProps {
  value: PledgeFilterValues;
  onChange: (value: PledgeFilterValues) => void;
  /** Show the campaign and department choices (the whole-church register). */
  showScope: boolean;
}

function ScopeFilters({ value, onChange }: Omit<PledgeFiltersProps, "showScope">) {
  const { campaigns, departments } = usePledgeScopeOptions();
  const shown = value.department === ALL ? campaigns : campaigns.filter((c) => String(c.categoryId) === value.department);

  return (
    <>
      <div className="space-y-1">
        <Label htmlFor="pledge-campaign">Campaign</Label>
        <Select name="campaign" value={value.campaign} onValueChange={(campaign) => onChange({ ...value, campaign })}>
          <SelectTrigger id="pledge-campaign" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All campaigns</SelectItem>
            {shown.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="pledge-department">Department</Label>
        <Select
          name="department"
          value={value.department}
          onValueChange={(department) => onChange({ ...value, department, campaign: ALL })}
        >
          <SelectTrigger id="pledge-department" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

export function PledgeFilters({ value, onChange, showScope }: PledgeFiltersProps) {
  const [searchInput, setSearchInput] = useState(value.search);

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault();
    onChange({ ...value, search: searchInput.trim() });
  };

  const reset = () => {
    setSearchInput("");
    onChange(NO_FILTERS);
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <form onSubmit={applySearch} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <Label htmlFor="pledge-search">Search</Label>
            <Input
              id="pledge-search"
              type="search"
              value={searchInput}
              placeholder="Member name or phone"
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button type="submit" variant="outline">
            <Search className="size-4" />
            Search
          </Button>
        </form>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {showScope && <ScopeFilters value={value} onChange={onChange} />}
          <div className="space-y-1">
            <Label htmlFor="pledge-status">Status</Label>
            <Select name="status" value={value.status} onValueChange={(status) => onChange({ ...value, status })}>
              <SelectTrigger id="pledge-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {Object.entries(PLEDGE_STATUS_LABELS).map(([status, label]) => (
                  <SelectItem key={status} value={status}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={reset}>
            Reset filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
