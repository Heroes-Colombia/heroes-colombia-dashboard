"use client"

import { useState, useEffect } from "react"
import { CategoryService } from "@/lib/services/category-service"
import type { BusinessCategory } from "@/lib/types"

export function useCategories() {
  const [categories, setCategories] = useState<BusinessCategory[]>([])
  const [isLoading, setIsLoading] = useState(false) // Start as false for SSR
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Set client flag to avoid hydration issues
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Only fetch categories on the client side
    if (!isClient) return

    const fetchCategories = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const fetchedCategories = await CategoryService.getCategories()

        if (fetchedCategories.length > 0) {
          setCategories(fetchedCategories)
        } else {
          // Keep fallback categories if none are fetched
          console.warn("No categories fetched from Firebase, using fallback categories")
        }
      } catch (err) {
        console.error("Error fetching categories:", err)
        setError("Failed to load categories")
        // Keep fallback categories on error
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [isClient])

  const getCategoryById = (categoryId: string): BusinessCategory | undefined => {
    return categories.find((cat) => cat.category_id === categoryId)
  }

  const getCategoryName = (categoryId: string): string => {
    const category = getCategoryById(categoryId)
    return category?.name || categoryId
  }

  return {
    categories,
    isLoading,
    error,
    getCategoryById,
    getCategoryName,
  }
}