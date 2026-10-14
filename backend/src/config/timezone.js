// timezone.js
//
// MUST be the very first import in server.js.
//
// Attendance dates, the absence cut-off, leave days and the payroll month
// boundaries are all calculated with the server's local clock. Hosting
// platforms run in UTC by default, which shifts every one of those by 5h30m
// (e.g. "today" would still be yesterday until 5:30 AM IST). Pinning the
// process timezone here makes the app behave the same on a laptop and on a
// server, whatever the host's TZ is.
//
// dotenv is loaded first so APP_TIMEZONE can be set in .env.

import "dotenv/config";

process.env.TZ = process.env.APP_TIMEZONE || "Asia/Kolkata";