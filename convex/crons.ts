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

export default crons;
