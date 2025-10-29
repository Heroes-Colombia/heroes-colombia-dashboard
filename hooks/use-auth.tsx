"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { type CustomerUser, getCurrentUser, refreshUserCache } from "@/lib/auth"

interface AuthContextType {
  user: CustomerUser | null
  loading: boolean
  refetch: () => Promise<void>
  refreshCache: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error("Error fetching user:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        // User logged out, clear the user state immediately
        setUser(null)
        setLoading(false)
      } else {
        // User logged in or auth state restored, fetch full user profile
        // getCurrentUser now checks session expiry and cache automatically
        setLoading(true)
        await fetchUser()
      }
    })

    return () => unsubscribe()
  }, [])

  const refetch = async () => {
    setLoading(true)
    await fetchUser()
  }

  // New method to refresh cache after business data updates
  const refreshCache = async () => {
    try {
      const updatedUser = await refreshUserCache()
      if (updatedUser) {
        setUser(updatedUser)
      }
    } catch (error) {
      console.error("Error refreshing cache:", error)
    }
  }

  return <AuthContext.Provider value={{ user, loading, refetch, refreshCache }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
