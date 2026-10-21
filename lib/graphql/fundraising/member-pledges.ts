/**
 * Member and public pledge documents (Fundraising S3, lane S3-UI-E).
 *
 * Hand-written against the frozen SDL (church_BE/fundraising/api/schema.graphql)
 * and typed with lib/types/fundraising.ts. `myPledges` and `createPledge` are
 * self-service; `publicCampaigns` is open to anyone.
 */

import { gql } from "@apollo/client";

import type { Pledge, PledgeInput, PledgeResponse, PublicCampaign } from "@/lib/types/fundraising";

const PLEDGE_FIELDS = `
  id
  campaignId
  campaignTitle
  campaignSlug
  categoryId
  categoryName
  amount
  paid
  balance
  dueDate
  status
  createdAt
`;

/** What one row of "My pledges" needs. */
export type MyPledge = Pick<
  Pledge,
  | "id"
  | "campaignId"
  | "campaignTitle"
  | "campaignSlug"
  | "categoryId"
  | "categoryName"
  | "amount"
  | "paid"
  | "balance"
  | "dueDate"
  | "status"
  | "createdAt"
>;

export const MY_PLEDGES = gql`
  query MyPledges {
    myPledges {
      ${PLEDGE_FIELDS}
    }
  }
`;

export interface MyPledgesData {
  myPledges: MyPledge[];
}

/**
 * What a member can pledge to: public campaigns (filtered to those taking
 * pledges) and the church's active departments.
 */
export const PLEDGE_TARGETS = gql`
  query PledgeTargets {
    publicCampaigns {
      campaignId
      slug
      title
      allowPledges
      isAcceptingGifts
    }
    contributionCategories(isActive: true) {
      id
      name
    }
  }
`;

export type PledgeTargetCampaign = Pick<
  PublicCampaign,
  "campaignId" | "slug" | "title" | "allowPledges" | "isAcceptingGifts"
>;

export interface PledgeTargetDepartment {
  id: string;
  name: string;
}

export interface PledgeTargetsData {
  publicCampaigns: PledgeTargetCampaign[];
  contributionCategories: PledgeTargetDepartment[];
}

export const CREATE_PLEDGE = gql`
  mutation CreatePledge($input: PledgeInput!) {
    createPledge(input: $input) {
      success
      message
      pledge {
        ${PLEDGE_FIELDS}
      }
    }
  }
`;

export interface CreatePledgeVars {
  input: PledgeInput;
}

export interface CreatePledgeData {
  createPledge: Omit<PledgeResponse, "pledge"> & { pledge: MyPledge | null };
}

export const CANCEL_PLEDGE = gql`
  mutation CancelPledge($id: ID!, $reason: String!) {
    cancelPledge(id: $id, reason: $reason) {
      success
      message
      pledge {
        id
        status
        balance
      }
    }
  }
`;

export interface CancelPledgeVars {
  id: string;
  reason: string;
}

export interface CancelPledgeData {
  cancelPledge: Omit<PledgeResponse, "pledge"> & {
    pledge: Pick<Pledge, "id" | "status" | "balance"> | null;
  };
}
