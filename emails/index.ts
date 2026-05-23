import * as React from "react";
import { renderAsync } from "@react-email/render";

import { WelcomeEmail } from "./WelcomeEmail";
import { NewLeadEmail } from "./NewLeadEmail";
import { PaymentReceiptEmail } from "./PaymentReceiptEmail";
import { PaymentFailedEmail } from "./PaymentFailedEmail";
import { ListingsDraftedEmail } from "./ListingsDraftedEmail";

export type { WelcomeEmailProps } from "./WelcomeEmail";
export type { NewLeadEmailProps } from "./NewLeadEmail";
export type { PaymentReceiptEmailProps } from "./PaymentReceiptEmail";
export type { PaymentFailedEmailProps } from "./PaymentFailedEmail";
export type { ListingsDraftedEmailProps, DraftReason } from "./ListingsDraftedEmail";

// ─── Render helpers ───────────────────────────────────────────────────────────

export async function renderWelcomeEmail(
  props: React.ComponentProps<typeof WelcomeEmail>
): Promise<string> {
  return renderAsync(React.createElement(WelcomeEmail, props));
}

export async function renderNewLeadEmail(
  props: React.ComponentProps<typeof NewLeadEmail>
): Promise<string> {
  return renderAsync(React.createElement(NewLeadEmail, props));
}

export async function renderPaymentReceiptEmail(
  props: React.ComponentProps<typeof PaymentReceiptEmail>
): Promise<string> {
  return renderAsync(React.createElement(PaymentReceiptEmail, props));
}

export async function renderPaymentFailedEmail(
  props: React.ComponentProps<typeof PaymentFailedEmail>
): Promise<string> {
  return renderAsync(React.createElement(PaymentFailedEmail, props));
}

export async function renderListingsDraftedEmail(
  props: React.ComponentProps<typeof ListingsDraftedEmail>
): Promise<string> {
  return renderAsync(React.createElement(ListingsDraftedEmail, props));
}
