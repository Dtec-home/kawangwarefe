"use client";

import { useState, useCallback } from "react";

export interface AudienceFilter {
  departmentIds: string[];
  groupIds: string[];
  roles: string[];
  memberIds: string[];
  includeGuests: boolean;
  includeMinors: boolean;
}

const EMPTY: AudienceFilter = {
  departmentIds: [],
  groupIds: [],
  roles: [],
  memberIds: [],
  includeGuests: false,
  includeMinors: true,
};

export function useAudienceFilter() {
  const [filter, setFilter] = useState<AudienceFilter>(EMPTY);

  const setDepartmentIds = useCallback((ids: string[]) =>
    setFilter(f => ({ ...f, departmentIds: ids })), []);

  const setGroupIds = useCallback((ids: string[]) =>
    setFilter(f => ({ ...f, groupIds: ids })), []);

  const setRoles = useCallback((roles: string[]) =>
    setFilter(f => ({ ...f, roles })), []);

  const setMemberIds = useCallback((ids: string[]) =>
    setFilter(f => ({ ...f, memberIds: ids })), []);

  const setIncludeGuests = useCallback((v: boolean) =>
    setFilter(f => ({ ...f, includeGuests: v })), []);

  const setIncludeMinors = useCallback((v: boolean) =>
    setFilter(f => ({ ...f, includeMinors: v })), []);

  const reset = useCallback(() => setFilter(EMPTY), []);

  /** Serialises to the JSON string expected by the GraphQL mutations. */
  const toJson = useCallback((): string => {
    const out: Record<string, unknown> = {};
    if (filter.departmentIds.length) out.department_ids = filter.departmentIds.map(Number);
    if (filter.groupIds.length) out.group_ids = filter.groupIds.map(Number);
    if (filter.roles.length) out.roles = filter.roles;
    if (filter.memberIds.length) out.member_ids = filter.memberIds.map(Number);
    if (filter.includeGuests) out.include_guests = true;
    if (!filter.includeMinors) out.include_minors = false;
    return JSON.stringify(out);
  }, [filter]);

  return {
    filter,
    toJson,
    setDepartmentIds,
    setGroupIds,
    setRoles,
    setMemberIds,
    setIncludeGuests,
    setIncludeMinors,
    reset,
  };
}
