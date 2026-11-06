/**
 * Merging duplicate members (MG-2, MEMBER_IDENTITY/02_CONTRACTS.md §2). Admins only.
 */

import { gql } from "@apollo/client";

const MERGE_MEMBER = `id fullName phoneNumber memberNumber isGuest`;
const MERGE_RECORD = `id status reason mergedBy executedAt reversedBy reversedAt reverseReason
  survivor { ${MERGE_MEMBER} } duplicate { ${MERGE_MEMBER} }`;

export const MEMBER_MERGE_PREVIEW = gql`
  query MemberMergePreview($survivorId: ID!, $duplicateId: ID!) {
    memberMergePreview(survivorId: $survivorId, duplicateId: $duplicateId) {
      survivor { ${MERGE_MEMBER} }
      duplicate { ${MERGE_MEMBER} }
      moves { key label count }
      conflicts { key description resolution }
      blockers
      totals { givenAmount giftCount receiptCount pledgedAmount pledgePaidAmount }
      previewHash
    }
  }
`;

export const MERGE_MEMBERS = gql`
  mutation MergeMembers($survivorId: ID!, $duplicateId: ID!, $reason: String!, $confirmName: String!, $previewHash: String!) {
    mergeMembers(survivorId: $survivorId, duplicateId: $duplicateId, reason: $reason, confirmName: $confirmName, previewHash: $previewHash) {
      success message code merge { ${MERGE_RECORD} }
    }
  }
`;

export const MEMBER_MERGES = gql`
  query MemberMerges { memberMerges { ${MERGE_RECORD} } }
`;

export const MEMBER_MERGE_UNDO_PREVIEW = gql`
  query MemberMergeUndoPreview($mergeId: ID!) {
    memberMergeUndoPreview(mergeId: $mergeId) {
      merge { id }
      movesBack { key label count }
      sinceMergeGoingBack { key label count }
      sinceMergeStaying { key label count }
      blockers
    }
  }
`;

export const UNDO_MEMBER_MERGE = gql`
  mutation UndoMemberMerge($mergeId: ID!, $reason: String!) {
    undoMemberMerge(mergeId: $mergeId, reason: $reason) { success message code merge { ${MERGE_RECORD} } }
  }
`;

export const POSSIBLE_DUPLICATE_MEMBERS = gql`
  query PossibleDuplicateMembers($limit: Int, $offset: Int) {
    possibleDuplicateMembers(limit: $limit, offset: $offset) {
      total hasMore
      items { reason giftCounts giftTotals members { ${MERGE_MEMBER} } }
    }
  }
`;

export const MEMBER_TOMBSTONE_REDIRECT = gql`
  query MemberTombstoneRedirect($memberId: ID!) {
    memberTombstoneRedirect(memberId: $memberId) { id mergedIntoId }
  }
`;
