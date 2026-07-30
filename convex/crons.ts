import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "daily investment accrual",
  { hourUTC: 0, minuteUTC: 5 },
  internal.investments.runDailyAccrual,
);

// Runs hourly rather than daily so a term ending mid-day doesn't sit
// unfinalized for up to 24h -- cheap to run since it filters to investments
// whose endsAt has actually passed.
crons.interval(
  "investment term finalization sweep",
  { hours: 1 },
  internal.investments.runFinalizeSweep,
);

// Cached, not live-fetched per request -- deposit quoting and dashboard
// totals read from this cache (see convex/exchangeRates.ts), so a 5-minute
// staleness window is an acceptable tradeoff for not depending on a third
// party being up in the request path.
crons.interval(
  "refresh exchange rates",
  { minutes: 5 },
  internal.exchangeRates.refreshRatesInternal,
);

export default crons;
