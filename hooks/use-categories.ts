"use client"

import { useState, useEffect } from "react"
import { firebaseService } from "@/lib/firebase-service"
import type { BusinessCategory } from "@/lib/types"

// Fallback categories matching the current hardcoded ones
const FALLBACK_CATEGORIES: BusinessCategory[] = [
  {
    category_id: "restaurante",
    name: "Restaurante",
    image: "",
    status: "active",
  },
  {
    category_id: "retail",
    name: "Retail/Tienda",
    image: "",
    status: "active",
  },
  {
    category_id: "servicios",
    name: "Servicios",
    image: "",
    status: "active",
  },
  {
    category_id: "salud",
    name: "Salud y Bienestar",
    image: "",
    status: "active",
  },
  {
    category_id: "educacion",
    name: "Educación",
    image: "",
    status: "active",
  },
  {
    category_id: "tecnologia",
    name: "Tecnología",
    image: "",
    status: "active",
  },
  {
    category_id: "entretenimiento",
    name: "Entretenimiento",
    image: "",
    status: "active",
  },
  {
    category_id: "otros",
    name: "Otros",
    image: "",
    status: "active",
  },
]

export function useCategories() {
  const [categories, setCategories] = useState<BusinessCategory[]>(FALLBACK_CATEGORIES)
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

        const fetchedCategories = await firebaseService.getCategories()

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