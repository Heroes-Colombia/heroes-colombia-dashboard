"use client"

import { useState, useEffect } from "react"
import { firebaseService } from "@/lib/firebase-service"
import type { BusinessProfile } from "@/lib/types"

interface UseBusinessesFilters {
  status?: string
  plan?: string
  category?: string
  limit?: number
}

export function useBusinesses(filters?: UseBusinessesFilters) {
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const fetchBusinesses = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const fetchedBusinesses = await firebaseService.getBusinesses(filters)
        setBusinesses(fetchedBusinesses)
      } catch (err) {
        console.error("Error fetching businesses:", err)
        setError("Failed to load businesses")
        setBusinesses([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusinesses()
  }, [isClient, filters?.status, filters?.plan, filters?.category, filters?.limit])

  const refreshBusinesses = async () => {
    if (!isClient) return

    try {
      setIsLoading(true)
      setError(null)
      const fetchedBusinesses = await firebaseService.getBusinesses(filters)
      setBusinesses(fetchedBusinesses)
    } catch (err) {
      console.error("Error refreshing businesses:", err)
      setError("Failed to refresh businesses")
    } finally {
      setIsLoading(false)
    }
  }

  const updateBusinessStatus = async (businessId: string, status: BusinessProfile["status"], notes?: string) => {
    try {
      const success = await firebaseService.updateBusinessStatus(businessId, status, notes)
      if (success) {
        // Update local state
        setBusinesses((prev) =>
          prev.map((business) =>
            business.id === businessId
              ? { ...business, status, verificationNotes: notes }
              : business
          )
        )
        return true
      }
      return false
    } catch (err) {
      console.error("Error updating business status:", err)
      setError("Failed to update business status")
      return false
    }
  }

  const getBusinessById = (businessId: string): BusinessProfile | undefined => {
    return businesses.find((business) => business.id === businessId)
  }

  const getBusinessesByStatus = (status: BusinessProfile["status"]): BusinessProfile[] => {
    return businesses.filter((business) => business.status === status)
  }

  const getBusinessesByCategory = (categoryId: string): BusinessProfile[] => {
    return businesses.filter((business) => business.categories?.includes(categoryId))
  }

  return {
    businesses,
    isLoading,
    error,
    refreshBusinesses,
    updateBusinessStatus,
    getBusinessById,
    getBusinessesByStatus,
    getBusinessesByCategory,
  }
}

export function useBusiness(businessId: string | null) {
  const [business, setBusiness] = useState<BusinessProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !businessId) return

    const fetchBusiness = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const fetchedBusiness = await firebaseService.getBusiness(businessId)
        setBusiness(fetchedBusiness)
      } catch (err) {
        console.error("Error fetching business:", err)
        setError("Failed to load business")
        setBusiness(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusiness()
  }, [isClient, businessId])

  const updateBusiness = async (data: Partial<BusinessProfile>) => {
    if (!businessId) return false

    try {
      const success = await firebaseService.updateBusiness(businessId, data)
      if (success && business) {
        setBusiness({ ...business, ...data })
        return true
      }
      return false
    } catch (err) {
      console.error("Error updating business:", err)
      setError("Failed to update business")
      return false
    }
  }

  const refreshBusiness = async () => {
    if (!isClient || !businessId) return

    try {
      setIsLoading(true)
      setError(null)
      const fetchedBusiness = await firebaseService.getBusiness(businessId)
      setBusiness(fetchedBusiness)
    } catch (err) {
      console.error("Error refreshing business:", err)
      setError("Failed to refresh business")
    } finally {
      setIsLoading(false)
    }
  }

  return {
    business,
    isLoading,
    error,
    updateBusiness,
    refreshBusiness,
  }
}

export function useBusinessesByOwner(ownerUid: string | null) {
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !ownerUid) return

    const fetchBusinesses = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const fetchedBusinesses = await firebaseService.getBusinessesByOwner(ownerUid)
        setBusinesses(fetchedBusinesses)
      } catch (err) {
        console.error("Error fetching businesses by owner:", err)
        setError("Failed to load businesses")
        setBusinesses([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusinesses()
  }, [isClient, ownerUid])

  return {
    businesses,
    isLoading,
    error,
  }
}