"use client"

import { useState, useEffect } from "react"
import { PromotionService } from "@/lib/services/promotion-service"
import type { Promotion } from "@/lib/types"

interface UsePromotionsOptions {
  promotionId?: string | null  // Fetch single promotion by ID
  businessId?: string          // Filter by business
  status?: "active" | "inactive"
  limit?: number
}

/**
 * Unified hook for fetching and managing promotions
 * Supports both single promotion and multiple promotions modes
 */
export function usePromotions(options?: UsePromotionsOptions) {
  const isSingleMode = !!options?.promotionId

  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [promotion, setPromotion] = useState<Promotion | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return
    if (isSingleMode && !options?.promotionId) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        if (isSingleMode && options.promotionId) {
          // Single promotion mode
          const fetchedPromotion = await PromotionService.getPromotion(options.promotionId)
          setPromotion(fetchedPromotion)
        } else {
          // Multiple promotions mode
          const filters = {
            businessId: options?.businessId,
            status: options?.status,
            limit: options?.limit,
          }
          const fetchedPromotions = await PromotionService.getPromotions(filters)
          setPromotions(fetchedPromotions)
        }
      } catch (err) {
        console.error(`Error fetching ${isSingleMode ? 'promotion' : 'promotions'}:`, err)
        setError(`Failed to load ${isSingleMode ? 'promotion' : 'promotions'}`)
        if (isSingleMode) {
          setPromotion(null)
        } else {
          setPromotions([])
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isClient, isSingleMode, options?.promotionId, options?.businessId, options?.status, options?.limit])

  const refresh = async () => {
    if (!isClient) return
    if (isSingleMode && !options?.promotionId) return

    try {
      setIsLoading(true)
      setError(null)

      if (isSingleMode && options.promotionId) {
        const fetchedPromotion = await PromotionService.getPromotion(options.promotionId)
        setPromotion(fetchedPromotion)
      } else {
        const filters = {
          businessId: options?.businessId,
          status: options?.status,
          limit: options?.limit,
        }
        const fetchedPromotions = await PromotionService.getPromotions(filters)
        setPromotions(fetchedPromotions)
      }
    } catch (err) {
      console.error(`Error refreshing ${isSingleMode ? 'promotion' : 'promotions'}:`, err)
      setError(`Failed to refresh ${isSingleMode ? 'promotion' : 'promotions'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const updatePromotionData = async (promotionId: string, data: Partial<Promotion> | "active" | "inactive") => {
    try {
      const updateData = typeof data === "string" ? { status: data } : data
      const success = await PromotionService.updatePromotion(promotionId, updateData)

      if (success) {
        if (isSingleMode && promotion) {
          // Update single promotion state
          setPromotion({ ...promotion, ...updateData })
        } else {
          // Update in promotions list
          setPromotions((prev) =>
            prev.map((p) => (p.id === promotionId ? { ...p, ...updateData } : p))
          )
        }
        return true
      }
      return false
    } catch (err) {
      console.error("Error updating promotion:", err)
      setError("Failed to update promotion")
      return false
    }
  }

  const deletePromotion = async (promotionId: string) => {
    try {
      const success = await PromotionService.deletePromotion(promotionId)
      if (success) {
        setPromotions((prev) => prev.filter((p) => p.id !== promotionId))
        return true
      }
      return false
    } catch (err) {
      console.error("Error deleting promotion:", err)
      setError("Failed to delete promotion")
      return false
    }
  }

  const createPromotion = async (promotionData: Omit<Promotion, "id">) => {
    try {
      const promotionId = await PromotionService.createPromotion(promotionData)
      if (promotionId) {
        // Refresh the list to include the new promotion
        await refresh()
        return promotionId
      }
      return null
    } catch (err) {
      console.error("Error creating promotion:", err)
      setError("Failed to create promotion")
      return null
    }
  }

  // Utility functions for filtering promotions
  const getPromotionById = (id: string): Promotion | undefined => {
    return promotions.find((p) => p.id === id)
  }

  const getActivePromotions = (): Promotion[] => {
    return promotions.filter((p) => p.status === "active")
  }

  const getExpiredPromotions = (): Promotion[] => {
    const now = new Date()
    return promotions.filter((p) => {
      const expiredAt = p.expired_at
      if (expiredAt && typeof expiredAt === "object" && "seconds" in expiredAt) {
        return new Date(expiredAt.seconds * 1000) < now
      }
      return new Date(expiredAt) < now
    })
  }

  const getPromotionsByBusiness = (businessId: string): Promotion[] => {
    return promotions.filter((p) => p.business_id === businessId)
  }

  // Return appropriate data based on mode
  if (isSingleMode) {
    return {
      promotion,
      isLoading,
      error,
      refresh,
      updatePromotion: updatePromotionData,
    }
  }

  return {
    promotions,
    isLoading,
    error,
    refresh,
    updatePromotionStatus: updatePromotionData,
    updatePromotion: updatePromotionData,
    deletePromotion,
    createPromotion,
    getPromotionById,
    getActivePromotions,
    getExpiredPromotions,
    getPromotionsByBusiness,
  }
}

// Backwards-compatible wrapper for single promotion fetching
export function usePromotion(promotionId: string | null) {
  return usePromotions({ promotionId })
}

// Backwards-compatible wrapper for business promotions
export function useBusinessPromotions(businessId: string) {
  return usePromotions({ businessId })
}