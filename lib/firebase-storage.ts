/**
 * Firebase Storage Utilities
 * Handles image uploads and deletions for Heroes Colombia Dashboard
 * Follows the same pattern as the Flutter mobile app
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { storage } from "@/lib/firebase"

/**
 * Extract file extension from file name or path
 * Matches mobile app pattern: regex `(\w{3,4}$)`
 */
function getFileExtension(file: File): string {
  const match = file.name.match(/\.(\w{3,4})$/)
  return match ? match[1] : "jpg"
}

/**
 * Extract extension from Firebase Storage URL
 * Matches mobile app pattern: regex `\.(\w{3,4})\?`
 */
function getExtensionFromUrl(url: string): string {
  const match = url.match(/\.(\w{3,4})\?/)
  return match ? match[1] : "jpg"
}

/**
 * Upload business featured image
 * Path: businessesImages/{businessId}/featureImage/featured_image.{extension}
 *
 * @param file - Image file to upload
 * @param businessId - Business ID
 * @returns Promise<string> - Download URL of uploaded image
 */
export async function uploadBusinessFeaturedImage(
  file: File,
  businessId: string
): Promise<string> {
  const extension = getFileExtension(file)
  const storagePath = `businessesImages/${businessId}/featureImage/featured_image.${extension}`

  const storageRef = ref(storage, storagePath)

  // Set metadata
  const metadata = {
    contentType: file.type,
    customMetadata: {
      uploadedAt: new Date().toISOString(),
    },
  }

  // Upload file
  const snapshot = await uploadBytes(storageRef, file, metadata)

  // Get download URL
  const downloadURL = await getDownloadURL(snapshot.ref)

  return downloadURL
}

/**
 * Upload promotion featured image
 * Path: promotionsImages/{promotionId}/featureImage/featured_image.{extension}
 *
 * @param file - Image file to upload
 * @param promotionId - Promotion ID (ensures each promotion has unique image)
 * @returns Promise<string> - Download URL of uploaded image
 */
export async function uploadPromotionFeaturedImage(
  file: File,
  promotionId: string
): Promise<string> {
  const extension = getFileExtension(file)
  const storagePath = `promotionsImages/${promotionId}/featureImage/featured_image.${extension}`

  const storageRef = ref(storage, storagePath)

  // Set metadata
  const metadata = {
    contentType: file.type,
    customMetadata: {
      uploadedAt: new Date().toISOString(),
    },
  }

  // Upload file
  const snapshot = await uploadBytes(storageRef, file, metadata)

  // Get download URL
  const downloadURL = await getDownloadURL(snapshot.ref)

  return downloadURL
}

/**
 * Delete business featured image from Firebase Storage
 *
 * @param imageUrl - Full Firebase Storage URL
 * @param businessId - Business ID
 */
export async function deleteBusinessFeaturedImage(
  imageUrl: string,
  businessId: string
): Promise<void> {
  try {
    const extension = getExtensionFromUrl(imageUrl)
    const storagePath = `businessesImages/${businessId}/featureImage/featured_image.${extension}`

    const storageRef = ref(storage, storagePath)
    await deleteObject(storageRef)
  } catch (error: any) {
    // If file doesn't exist, that's okay (might have been deleted already)
    if (error.code !== "storage/object-not-found") {
      throw error
    }
  }
}

/**
 * Delete promotion featured image from Firebase Storage
 *
 * @param imageUrl - Full Firebase Storage URL
 * @param promotionId - Promotion ID
 */
export async function deletePromotionFeaturedImage(
  imageUrl: string,
  promotionId: string
): Promise<void> {
  try {
    const extension = getExtensionFromUrl(imageUrl)
    const storagePath = `promotionsImages/${promotionId}/featureImage/featured_image.${extension}`

    const storageRef = ref(storage, storagePath)
    await deleteObject(storageRef)
  } catch (error: any) {
    // If file doesn't exist, that's okay (might have been deleted already)
    if (error.code !== "storage/object-not-found") {
      throw error
    }
  }
}

/**
 * Upload image with automatic retry on failure
 *
 * @param uploadFn - Upload function to call
 * @param maxRetries - Maximum number of retry attempts
 * @returns Promise<string | null> - Download URL or null if failed
 */
export async function uploadWithRetry(
  uploadFn: () => Promise<string>,
  maxRetries: number = 2
): Promise<string | null> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await uploadFn()
    } catch (error) {
      lastError = error as Error
      console.error(`Upload attempt ${attempt + 1} failed:`, error)

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }
  }

  console.error("Upload failed after all retries:", lastError)
  return null
}
