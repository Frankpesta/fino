/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as adminMessages from "../adminMessages.js";
import type * as auth from "../auth.js";
import type * as contact from "../contact.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as deposits from "../deposits.js";
import type * as emailLog from "../emailLog.js";
import type * as emailVerification from "../emailVerification.js";
import type * as emails from "../emails.js";
import type * as exchangeRates from "../exchangeRates.js";
import type * as http from "../http.js";
import type * as investmentPlans from "../investmentPlans.js";
import type * as investments from "../investments.js";
import type * as model_audit from "../model/audit.js";
import type * as model_authz from "../model/authz.js";
import type * as model_balances from "../model/balances.js";
import type * as model_email from "../model/email.js";
import type * as model_exchangeRates from "../model/exchangeRates.js";
import type * as model_secrets from "../model/secrets.js";
import type * as model_settings from "../model/settings.js";
import type * as passwordReset from "../passwordReset.js";
import type * as passwordResetActions from "../passwordResetActions.js";
import type * as platformSettings from "../platformSettings.js";
import type * as platformWallets from "../platformWallets.js";
import type * as profile from "../profile.js";
import type * as profileActions from "../profileActions.js";
import type * as referrals from "../referrals.js";
import type * as transactions from "../transactions.js";
import type * as twoFactorRateLimit from "../twoFactorRateLimit.js";
import type * as users from "../users.js";
import type * as wallet from "../wallet.js";
import type * as withdrawals from "../withdrawals.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  adminMessages: typeof adminMessages;
  auth: typeof auth;
  contact: typeof contact;
  crons: typeof crons;
  dashboard: typeof dashboard;
  deposits: typeof deposits;
  emailLog: typeof emailLog;
  emailVerification: typeof emailVerification;
  emails: typeof emails;
  exchangeRates: typeof exchangeRates;
  http: typeof http;
  investmentPlans: typeof investmentPlans;
  investments: typeof investments;
  "model/audit": typeof model_audit;
  "model/authz": typeof model_authz;
  "model/balances": typeof model_balances;
  "model/email": typeof model_email;
  "model/exchangeRates": typeof model_exchangeRates;
  "model/secrets": typeof model_secrets;
  "model/settings": typeof model_settings;
  passwordReset: typeof passwordReset;
  passwordResetActions: typeof passwordResetActions;
  platformSettings: typeof platformSettings;
  platformWallets: typeof platformWallets;
  profile: typeof profile;
  profileActions: typeof profileActions;
  referrals: typeof referrals;
  transactions: typeof transactions;
  twoFactorRateLimit: typeof twoFactorRateLimit;
  users: typeof users;
  wallet: typeof wallet;
  withdrawals: typeof withdrawals;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
