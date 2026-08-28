// Shared helper for admin list searches that use a PostgREST `.or()` filter.

/**
 * Strip characters that are significant inside a PostgREST `.or()` filter string
 * (commas separate conditions, parentheses group, `*`/`%` are ilike wildcards) so
 * a user's search term can't break or inject into the query.
 */
export function sanitizeSearchTerm(term: string): string {
  return term.replace(/[,()*\\%]/g, "").trim().slice(0, 100);
}
