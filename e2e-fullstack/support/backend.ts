/**
 * The phone's and Safaricom's side of a journey, through the backend's
 * test-only /e2e/ endpoints (church_BE/e2e_support, settings_e2e only).
 */

import { APIRequestContext, expect } from "@playwright/test";

export const BACKEND_URL = process.env.E2E_BACKEND_URL ?? "http://127.0.0.1:8001";

export interface SeededPerson {
  phone: string;
  name: string;
  memberId: number;
  role: string | null;
}

export interface Seed {
  people: Record<string, SeededPerson>;
  departments: Record<string, { id: number; name: string }>;
  paybill: string;
}

export interface Sms {
  id: number;
  phone: string;
  body: string;
}

export class Backend {
  constructor(private readonly request: APIRequestContext) {}

  private url(path: string) {
    return `${BACKEND_URL}/e2e/${path}`;
  }

  /** Empty the database and seed the known people and departments. */
  async reset(): Promise<Seed> {
    const response = await this.request.post(this.url("reset/"));
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /** The newest 6-digit code texted to `phone` (waits for it to arrive). */
  async latestCode(phone: string, afterSmsId = 0): Promise<string> {
    let code: string | null = null;
    await expect
      .poll(async () => {
        const response = await this.request.get(this.url(`code/?phone=${phone}`));
        if (!response.ok()) return null;
        const body = await response.json();
        code = body.smsId > afterSmsId ? body.code : null;
        return code;
      }, { message: `no code texted to ${phone}` })
      .not.toBeNull();
    return code as unknown as string;
  }

  async outbox(phone?: string, after = 0): Promise<Sms[]> {
    const query = new URLSearchParams();
    if (phone) query.set("phone", phone);
    if (after) query.set("after", String(after));
    const response = await this.request.get(this.url(`outbox/?${query}`));
    return (await response.json()).messages;
  }

  async lastSmsId(): Promise<number> {
    const messages = await this.outbox();
    return messages.length ? messages[messages.length - 1].id : 0;
  }

  /** Waits until `phone` has received an SMS (after `after`) containing every snippet. */
  async expectSms(phone: string, snippets: string[], after = 0): Promise<Sms> {
    let found: Sms | undefined;
    await expect
      .poll(async () => {
        const messages = await this.outbox(phone, after);
        found = messages.find((m) => snippets.every((s) => m.body.includes(s)));
        return !!found;
      }, { message: `${phone} got no SMS containing ${JSON.stringify(snippets)}` })
      .toBe(true);
    return found as Sms;
  }

  /** The member answers the M-Pesa prompt on their phone. */
  async respondToStk(phone: string, result: "pay" | "cancel" = "pay", echoPaybill = true) {
    let body: Record<string, unknown> = {};
    await expect
      .poll(async () => {
        const response = await this.request.post(this.url("stk/respond/"), {
          data: { phone, result, echoPaybill },
        });
        body = await response.json();
        return response.ok();
      }, { message: `no M-Pesa prompt was sent to ${phone}` })
      .toBe(true);
    return body;
  }

  async stkRequests(phone: string) {
    const response = await this.request.get(this.url(`stk/?phone=${phone}`));
    return (await response.json()).requests as { accountReference: string; amount: string; state: string }[];
  }

  /** A Pay Bill payment from `phone` to `account`, as Safaricom confirms it. */
  async paybill(phone: string, amount: string, account: string, firstName = "") {
    const response = await this.request.post(this.url("paybill/"), {
      data: { phone, amount, account, firstName },
    });
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  async runJob(job: "pledge-reminders" | "champion-digests" | "finance-integrity") {
    const response = await this.request.post(this.url(`run/${job}/`));
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /** Move a pledge's due date (the product refuses past dates, so overdue needs this). */
  async backdatePledge(pledgeId: string, dueDate: string) {
    const response = await this.request.post(this.url("pledge/backdate/"), { data: { pledgeId, dueDate } });
    expect(response.ok()).toBeTruthy();
  }

  async blockedRequests() {
    const response = await this.request.get(this.url("blocked/"));
    return (await response.json()).blocked as { method: string; url: string }[];
  }

  /** A GraphQL call made the way a client would (optionally signed in). */
  async graphql(query: string, variables: Record<string, unknown> = {}, token?: string) {
    const response = await this.request.post(`${BACKEND_URL}/graphql/`, {
      data: { query, variables },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.json();
  }

  /** An access token for `phone` through the real OTP login (no browser). */
  async tokenFor(phone: string): Promise<string> {
    const before = await this.lastSmsId();
    await this.graphql(`mutation($p: String!) { requestOtp(phoneNumber: $p) { success } }`, { p: phone });
    const code = await this.latestCode(phone, before);
    const result = await this.graphql(
      `mutation($p: String!, $c: String!) { verifyOtp(phoneNumber: $p, otpCode: $c) { success accessToken } }`,
      { p: phone, c: code },
    );
    return result.data.verifyOtp.accessToken;
  }
}
