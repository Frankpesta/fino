/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as dashboard from "../dashboard.js";
import type * as deposits from "../deposits.js";
import type * as emailVerification from "../emailVerification.js";
import type * as http from "../http.js";
import type * as model_authz from "../model/authz.js";
import type * as platformWallets from "../platformWallets.js";
import type * as transactions from "../transactions.js";
import type * as users from "../users.js";
import type * as withdrawals from "../withdrawals.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  dashboard: typeof dashboard;
  deposits: typeof deposits;
  emailVerification: typeof emailVerification;
  http: typeof http;
  "model/authz": typeof model_authz;
  platformWallets: typeof platformWallets;
  transactions: typeof transactions;
  users: typeof users;
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
