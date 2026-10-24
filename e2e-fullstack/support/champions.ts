/**
 * Lane E2E-C helpers: setting up a campaign that takes champions, and the
 * staff-side GraphQL reads the champion and Pay Bill journeys check against.
 *
 * Set-up goes through the real API as the real people (treasurer creates and
 * submits, an admin who is not the creator approves), so it is a shortcut for
 * the screens lane E2E-A covers, never a back door into the database.
 */

import { expect } from "@playwright/test";
import { Backend, Seed } from "./backend";

export interface ChampionCampaign {
  id: string;
  slug: string;
  title: string;
  code: string;
}

export interface ChampionRow {
  id: string;
  code: string;
  status: "PENDING" | "ACTIVE" | "INACTIVE";
  memberName: string;
  raised: string;
  donorCount: number;
}

export interface StaffContribution {
  amount: string;
  status: string;
  category: { code: string };
  departmentMemberIdentifier: string;
  giverName: string | null;
  member: { fullName: string; phoneNumber: string; isGuest: boolean };
}

/** Tokens are cached per phone for the scenario (each costs an OTP round trip). */
export class ChampionDesk {
  private tokens = new Map<string, string>();

  constructor(private readonly backend: Backend, private readonly seed: Seed) {}

  phoneOf(role: string): string {
    const person = this.seed.people[role];
    if (!person) throw new Error(`no seeded person "${role}"`);
    return person.phone;
  }

  async token(role: string): Promise<string> {
    const phone = this.phoneOf(role);
    if (!this.tokens.has(phone)) this.tokens.set(phone, await this.backend.tokenFor(phone));
    return this.tokens.get(phone)!;
  }

  /** Runs `query` as `role` and fails loudly on a GraphQL error. */
  async as<T = Record<string, unknown>>(role: string, query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const result = await this.backend.graphql(query, variables, await this.token(role));
    if (result.errors?.length) throw new Error(`GraphQL error as ${role}: ${JSON.stringify(result.errors)}`);
    return result.data as T;
  }

  /** An approved, public campaign in Building Fund that takes champions. */
  async approvedChampionCampaign(title: string, code: string, target = "500000"): Promise<ChampionCampaign> {
    const created = await this.as<{ createCampaign: { success: boolean; message: string; campaign: { id: string; slug: string } } }>(
      "treasurer",
      `mutation($input: CampaignInput!) {
        createCampaign(input: $input) { success message campaign { id slug } }
      }`,
      {
        input: {
          title,
          categoryId: String(this.seed.departments.BLDG.id),
          targetAmount: target,
          paybillCode: code,
          summary: `${title}: help us finish the work.`,
          isPublic: true,
          allowPledges: true,
          allowChampions: true,
        },
      },
    );
    expect(created.createCampaign.success, created.createCampaign.message).toBe(true);
    const { id, slug } = created.createCampaign.campaign;

    const submitted = await this.as<{ submitCampaign: { success: boolean; message: string } }>(
      "treasurer",
      `mutation($id: ID!) { submitCampaign(id: $id) { success message } }`,
      { id },
    );
    expect(submitted.submitCampaign.success, submitted.submitCampaign.message).toBe(true);

    const approved = await this.as<{ approveCampaign: { success: boolean; message: string; campaign: { status: string } } }>(
      "admin",
      `mutation($id: ID!) { approveCampaign(id: $id) { success message campaign { status } } }`,
      { id },
    );
    expect(approved.approveCampaign.success, approved.approveCampaign.message).toBe(true);
    expect(approved.approveCampaign.campaign.status).toBe("ACTIVE");
    return { id, slug, title, code };
  }

  async inviteChampion(campaignId: string, phone: string, code: string): Promise<ChampionRow> {
    const data = await this.as<{ inviteChampion: { success: boolean; message: string; champion: ChampionRow } }>(
      "treasurer",
      `mutation($campaignId: ID!, $phone: String!, $code: String!) {
        inviteChampion(campaignId: $campaignId, phoneNumber: $phone, code: $code) {
          success message champion { id code status memberName raised donorCount }
        }
      }`,
      { campaignId, phone, code },
    );
    expect(data.inviteChampion.success, data.inviteChampion.message).toBe(true);
    return data.inviteChampion.champion;
  }

  async deactivateChampion(championId: string) {
    const data = await this.as<{ deactivateChampion: { success: boolean; message: string } }>(
      "treasurer",
      `mutation($id: ID!) { deactivateChampion(id: $id) { success message } }`,
      { id: championId },
    );
    expect(data.deactivateChampion.success, data.deactivateChampion.message).toBe(true);
  }

  async champions(campaignId: string): Promise<ChampionRow[]> {
    const data = await this.as<{ champions: ChampionRow[] }>(
      "treasurer",
      `query($campaignId: ID!) { champions(campaignId: $campaignId) { id code status memberName raised donorCount } }`,
      { campaignId },
    );
    return data.champions;
  }

  async champion(campaignId: string, code: string): Promise<ChampionRow> {
    const found = (await this.champions(campaignId)).find((c) => c.code === code);
    if (!found) throw new Error(`no champion ${code} on campaign ${campaignId}`);
    return found;
  }

  /** The campaign's raised total as staff see it (counted money only). */
  async raised(campaignId: string): Promise<number> {
    const data = await this.as<{ campaign: { progress: { raised: string } } }>(
      "treasurer",
      `query($id: ID!) { campaign(id: $id) { progress { raised } } }`,
      { id: campaignId },
    );
    return Number.parseFloat(data.campaign.progress.raised);
  }

  /** The staff WhatsApp contributor list text (every donor's name and amount). */
  async contributorListText(campaignId: string): Promise<string> {
    const data = await this.as<{ whatsappContributorList: { text: string } }>(
      "treasurer",
      `query($id: ID!) { whatsappContributorList(campaignId: $id) { text } }`,
      { id: campaignId },
    );
    return data.whatsappContributorList.text;
  }

  /** Completed contributions as staff see them, newest first. */
  async staffContributions(): Promise<StaffContribution[]> {
    const data = await this.as<{ allContributions: { items: StaffContribution[] } }>(
      "treasurer",
      `query {
        allContributions(pagination: { limit: 100, offset: 0 }) {
          items {
            amount status departmentMemberIdentifier giverName
            category { code }
            member { fullName phoneNumber isGuest }
          }
        }
      }`,
    );
    return data.allContributions.items;
  }

  /** Turns on Welfare numbers and gives `role` the number `identifier`. */
  async giveWelfareNumber(role: string, identifier: string) {
    const welfare = String(this.seed.departments.WELF.id);
    const updated = await this.as<{ updateCategory: { success: boolean; message: string } }>(
      "admin",
      `mutation($id: ID!) {
        updateCategory(categoryId: $id, tracksMemberIdentifier: true, identifierLabel: "Welfare number") { success message }
      }`,
      { id: welfare },
    );
    expect(updated.updateCategory.success, updated.updateCategory.message).toBe(true);
    const set = await this.as<{ setMemberDepartmentIdentifier: { success: boolean; message: string } }>(
      "admin",
      `mutation($member: ID!, $category: ID!, $identifier: String!) {
        setMemberDepartmentIdentifier(memberId: $member, categoryId: $category, identifier: $identifier) { success message }
      }`,
      { member: String(this.seed.people[role].memberId), category: welfare, identifier },
    );
    expect(set.setMemberDepartmentIdentifier.success, set.setMemberDepartmentIdentifier.message).toBe(true);
  }
}

/** "KES 1,500.00", as the pages print money. */
export function kes(amount: number | string): string {
  const value = typeof amount === "number" ? amount : Number.parseFloat(amount);
  return `KES ${value.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
