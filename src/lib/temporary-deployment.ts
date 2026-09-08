/**
 * A deliberately narrow switch for the short-term server deployment.
 *
 * This keeps the normal Prisma/Redis/OSS-backed product path intact.  When
 * enabled, authentication and AI access are served without those services,
 * while provider calls still require MINIMAX_API_KEY on the server.
 */
export function isTemporaryDeployment() {
  return process.env.KRT_TEMPORARY_DEPLOYMENT === "true";
}

export const TEMPORARY_SCHOOL_ACCOUNT = {
  id: "temporary-school-krt01",
  loginIdentifier: "KRT01",
  password: "123456",
} as const;

export const TEMPORARY_SESSION_VALUE = "temporary-school-krt01";
