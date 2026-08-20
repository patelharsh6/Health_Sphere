/**
 * Convert a display name into a URL-safe slug.
 * e.g. "Alzheimer's Disease" → "alzheimers-disease", "COVID-19" → "covid-19"
 * @param {string} value
 * @returns {string}
 */
const slugify = (value = '') =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/['']/g, '')      // drop apostrophes instead of turning them into gaps
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

module.exports = { slugify };
