/**
 * Formats a duration in hours to a time string (e.g., 3.5 → "3:30 h")
 * @param hours - Duration in hours (can be decimal)
 * @returns Formatted time string like "3:30 h"
 */
export function formatDuration(hours: number): string {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}:${m.toString().padStart(2, '0')} h`
}

/**
 * Formats a duration in hours without unit suffix (e.g., 3.5 → "3:30")
 * Used for range displays where unit comes at the end
 */
function formatDurationRaw(hours: number): string {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}:${m.toString().padStart(2, '0')}`
}

/**
 * Formats a duration range to a time string (e.g., [3, 5.5] → "3:00 - 5:30 h")
 * @param range - Array with min and max hours
 * @returns Formatted time range string with unit at the end
 */
export function formatDurationRange(range: [number, number]): string {
    return `${formatDurationRaw(range[0])} - ${formatDurationRaw(range[1])} h`
}

/**
 * Parses a time string back to hours (e.g., "3:30 h" → 3.5)
 * @param timeStr - Time string like "3:30 h" or "3h"
 * @returns Duration in hours
 */
export function parseDuration(timeStr: string): number {
    // Remove unit suffix
    const cleaned = timeStr.replace(/\s*h\s*$/, '').trim()

    // Handle "H:MM" format
    if (cleaned.includes(':')) {
        const [h, m] = cleaned.split(':').map(Number)
        return h + (m / 60)
    }

    return parseFloat(cleaned) || 0
}
