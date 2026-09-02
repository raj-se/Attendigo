// The one account allowed to create other instructor accounts. Hardcoded
// on purpose — this project intentionally has no role/permission system,
// just this single check.
export const ADMIN_EMAIL = process.env.ADMIN_LOGIN_EMAIL;
