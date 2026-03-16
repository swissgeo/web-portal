// Minimal h3 stub for Vitest — actual implementations are replaced by vi.mock() in tests.
export const parseCookies = (_event: unknown): Record<string, string> => ({})
export const sendRedirect = (_event: unknown, _url: string, _status?: number): void => {}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type H3Event = any
