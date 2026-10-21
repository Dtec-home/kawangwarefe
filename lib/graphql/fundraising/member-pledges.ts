/**
 * Member and public pledge documents (Fundraising S3, lane S3-UI-E).
 *
 * Hand-written against the frozen SDL (church_BE/fundraising/api/schema.graphql)
 * and typed with lib/types/fundraising.ts. `myPledges` and `createPledge` are
 * self-service; `publicCampaigns` is open to anyone.
 */

import { gql } from "@apollo/client";

import type {
  GuestPledgeStartResponse,
  Pledge,
  PledgeInput,
  PledgeResponse,
  PublicCampaign,
} from "@/lib/types/fundraising";

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

/** Public page, step 1: SMS a one-time code to the guest's phone (decision 3). */
export const START_GUEST_PLEDGE = gql`
  mutation StartGuestPledge(
    $slug: String!
    $name: String!
    $phoneNumber: String!
    $amount: String!
    $dueDate: Date
  ) {
    startGuestPledge(slug: $slug, name: $name, phoneNumber: $phoneNumber, amount: $amount, dueDate: $dueDate) {
      success
      message
      pledgeId
    }
  }
`;

export interface StartGuestPledgeVars {
  slug: string;
  name: string;
  /** 2547XXXXXXXX */
  phoneNumber: string;
  amount: string;
  dueDate: string | null;
}

export interface StartGuestPledgeData {
  startGuestPledge: GuestPledgeStartResponse;
}

/** Public page, step 2: the code makes the pledge active. */
export const CONFIRM_GUEST_PLEDGE = gql`
  mutation ConfirmGuestPledge($pledgeId: ID!, $code: String!) {
    confirmGuestPledge(pledgeId: $pledgeId, code: $code) {
      success
      message
      pledge {
        id
        amount
        dueDate
        status
      }
    }
  }
`;

export interface ConfirmGuestPledgeVars {
  pledgeId: string;
  code: string;
}

export interface ConfirmGuestPledgeData {
  confirmGuestPledge: Omit<PledgeResponse, "pledge"> & {
    pledge: Pick<Pledge, "id" | "amount" | "dueDate" | "status"> | null;
  };
}
