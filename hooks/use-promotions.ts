"use client"

import { useState, useEffect } from "react"
import { firebaseService } from "@/lib/firebase-service"
import type { Advertisement } from "@/lib/types"

interface UsePromotionsFilters {
  businessId?: string
  status?: "active" | "inactive"
  limit?: number
}

export function usePromotions(filters?: UsePromotionsFilters) {
  const [promotions, setPromotions] = useState<Advertisement[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const fetchPromotions = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const fetchedPromotions = await firebaseService.getAdvertisements(filters)
        setPromotions(fetchedPromotions)
      } catch (err) {
        console.error("Error fetching promotions:", err)
        setError("Failed to load promotions")
        setPromotions([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPromotions()
  }, [isClient, filters?.businessId, filters?.status, filters?.limit])

  const refreshPromotions = async () => {
    if (!isClient) return

    try {
      setIsLoading(true)
      setError(null)
      const fetchedPromotions = await firebaseService.getAdvertisements(filters)
      setPromotions(fetchedPromotions)
    } catch (err) {
      console.error("Error refreshing promotions:", err)
      setError("Failed to refresh promotions")
    } finally {
      setIsLoading(false)
    }
  }

  const updatePromotionStatus = async (promotionId: string, status: "active" | "inactive") => {
    try {
      const success = await firebaseService.updateAdvertisementStatus(promotionId, status)
      if (success) {
        // Update local state
        setPromotions((prev) =>
          prev.map((promotion) =>
            promotion.id === promotionId
              ? { ...promotion, status }
              : promotion
          )
        )
        return true
      }
      return false
    } catch (err) {
      console.error("Error updating promotion status:", err)
      setError("Failed to update promotion status")
      return false
    }
  }

  const deletePromotion = async (promotionId: string) => {
    try {
      const success = await firebaseService.deleteAdvertisement(promotionId)
      if (success) {
        // Remove from local state
        setPromotions((prev) => prev.filter((promotion) => promotion.id !== promotionId))
        return true
      }
      return false
    } catch (err) {
      console.error("Error deleting promotion:", err)
      setError("Failed to delete promotion")
      return false
    }
  }

  const getPromotionById = (promotionId: string): Advertisement | undefined => {
    return promotions.find((promotion) => promotion.id === promotionId)
  }

  const getActivePromotions = (): Advertisement[] => {
    return promotions.filter((promotion) => promotion.status === "active")
  }

  const getExpiredPromotions = (): Advertisement[] => {
    const now = new Date()
    return promotions.filter((promotion) => {
      const expiredAt = promotion.expired_at
      if (expiredAt && typeof expiredAt === "object" && "seconds" in expiredAt) {
        return new Date(expiredAt.seconds * 1000) < now
      }
      return new Date(expiredAt) < now
    })
  }

  const getPromotionsByBusiness = (businessId: string): Advertisement[] => {
    return promotions.filter((promotion) => promotion.business_id === businessId)
  }

  return {
    promotions,
    isLoading,
    error,
    refreshPromotions,
    updatePromotionStatus,
    deletePromotion,
    getPromotionById,
    getActivePromotions,
    getExpiredPromotions,
    getPromotionsByBusiness,
  }
}

export function usePromotion(promotionId: string | null) {
  const [promotion, setPromotion] = useState<Advertisement | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !promotionId) return

    const fetchPromotion = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const fetchedPromotion = await firebaseService.getAdvertisement(promotionId)
        setPromotion(fetchedPromotion)
      } catch (err) {
        console.error("Error fetching promotion:", err)
        setError("Failed to load promotion")
        setPromotion(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPromotion()
  }, [isClient, promotionId])

  const updatePromotion = async (data: Partial<Advertisement>) => {
    if (!promotionId) return false

    try {
      const success = await firebaseService.updateAdvertisement(promotionId, data)
      if (success && promotion) {
        setPromotion({ ...promotion, ...data })
        return true
      }
      return false
    } catch (err) {
      console.error("Error updating promotion:", err)
      setError("Failed to update promotion")
      return false
    }
  }

  const refreshPromotion = async () => {
    if (!isClient || !promotionId) return

    try {
      setIsLoading(true)
      setError(null)
      const fetchedPromotion = await firebaseService.getAdvertisement(promotionId)
      setPromotion(fetchedPromotion)
    } catch (err) {
      console.error("Error refreshing promotion:", err)
      setError("Failed to refresh promotion")
    } finally {
      setIsLoading(false)
    }
  }

  return {
    promotion,
    isLoading,
    error,
    updatePromotion,
    refreshPromotion,
  }
}

export function useBusinessPromotions(businessId: string | null) {
  const [promotions, setPromotions] = useState<Advertisement[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !businessId) return

    const fetchPromotions = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const fetchedPromotions = await firebaseService.getAdvertisementsByBusiness(businessId)
        setPromotions(fetchedPromotions)
      } catch (err) {
        console.error("Error fetching business promotions:", err)
        setError("Failed to load promotions")
        setPromotions([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPromotions()
  }, [isClient, businessId])

  const createPromotion = async (promotionData: Omit<Advertisement, "id">) => {
    try {
      const promotionId = await firebaseService.createAdvertisement(promotionData)
      if (promotionId) {
        // Refresh the list to include the new promotion
        const fetchedPromotions = await firebaseService.getAdvertisementsByBusiness(businessId!)
        setPromotions(fetchedPromotions)
        return promotionId
      }
      return null
    } catch (err) {
      console.error("Error creating promotion:", err)
      setError("Failed to create promotion")
      return null
    }
  }

  return {
    promotions,
    isLoading,
    error,
    createPromotion,
  }
}