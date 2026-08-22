/**
 * One pagination contract for every list endpoint.
 *
 * The frontend reads `count`, `page` and `pages`, and several endpoints used to
 * return `count` alone (notably the doctor-search branch), which silently broke
 * the pager. Building every list response through `paginated()` makes that
 * impossible.
 */

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Normalise untrusted `?page=&limit=` into safe integers plus a mongo skip.
 * A caller passing `page=0`, `page=-3`, `limit=99999` or `limit=abc` gets
 * sensible values rather than a crash or an unbounded query.
 */
const parsePagination = (query = {}, { defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT } = {}) => {
  const rawPage = Number.parseInt(query.page, 10);
  const rawLimit = Number.parseInt(query.limit, 10);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, maxLimit) : defaultLimit;

  return { page, limit, skip: (page - 1) * limit };
};

/**
 * Build the standard list envelope.
 *
 * @param {Array}  data   the page of documents
 * @param {number} total  total matching documents, ignoring pagination
 * @param {{page: number, limit: number}} pagination
 */
const paginated = (data, total, { page, limit }) => ({
  success: true,
  count: total,
  page,
  pages: Math.max(1, Math.ceil(total / limit)),
  data,
});

module.exports = { parsePagination, paginated, DEFAULT_LIMIT, MAX_LIMIT };
