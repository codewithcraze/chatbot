/**
 * Shared utility functions used by server and client packages.
 */

/**
 * Format a date to a readable short string, e.g. "2:30 PM"
 * @param {Date|string} date
 * @returns {string}
 */
export function formatTime(date) {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format a date to a relative label: "Just now", "5 min ago", "Yesterday", or locale date.
 * @param {Date|string} date
 * @returns {string}
 */
export function formatRelativeTime(date) {
    const now = Date.now();
    const d = new Date(date).getTime();
    const diff = now - d; // ms

    if (diff < 60_000) return 'Just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
    if (diff < 86_400_000) return formatTime(date);
    if (diff < 172_800_000) return 'Yesterday';
    return new Date(date).toLocaleDateString();
}

/**
 * Generate a random hex ID (for client-side temporary IDs).
 * @param {number} [length=16]
 * @returns {string}
 */
export function generateId(length = 16) {
    const chars = 'abcdef0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

/**
 * Truncate a string to maxLen characters, appending "…" if truncated.
 * @param {string} str
 * @param {number} [maxLen=80]
 * @returns {string}
 */
export function truncate(str, maxLen = 80) {
    if (!str) return '';
    return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
}

/**
 * Debounce a function.
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
export function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Build query string from an object, skipping null/undefined values.
 * @param {Record<string, any>} params
 * @returns {string}
 */
export function buildQueryString(params) {
    return Object.entries(params)
        .filter(([, v]) => v !== null && v !== undefined && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
}

/**
 * Estimate wait time in minutes given queue position and avg handle time.
 * @param {number} position
 * @param {number} [avgMinutesPerChat=5]
 * @returns {string}
 */
export function estimateWait(position, avgMinutesPerChat = 5) {
    const minutes = position * avgMinutesPerChat;
    if (minutes < 1) return '<1 min';
    return `~${minutes} min`;
}
