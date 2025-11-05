/**
 * Date utility functions for Heroes Colombia Dashboard
 */

/**
 * Safely converts Firestore Timestamp to JavaScript Date
 * Handles Firestore Timestamps, Date objects, and ISO strings
 */
export function timestampToDate(timestamp: any): Date {
  if (!timestamp) {
    console.warn('Timestamp is null or undefined, returning current date')
    return new Date()
  }

  // Handle Firestore Timestamp (has seconds property)
  if (timestamp.seconds !== undefined) {
    return new Date(timestamp.seconds * 1000)
  }

  // Handle Date object
  if (timestamp instanceof Date) {
    return timestamp
  }

  // Handle ISO string or timestamp number
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    const date = new Date(timestamp)
    if (!isNaN(date.getTime())) {
      return date
    }
  }

  console.warn('Unknown timestamp format:', timestamp)
  return new Date()
}

/**
 * Get default expiration date for promotions (30 days from now)
 */
export function getDefaultExpirationDate(): Date {
  const DAYS = 30
  const MS_PER_DAY = 24 * 60 * 60 * 1000
  return new Date(Date.now() + DAYS * MS_PER_DAY)
}

/**
 * Check if a date is in the future
 */
export function isFutureDate(date: Date): boolean {
  return date.getTime() > Date.now()
}
