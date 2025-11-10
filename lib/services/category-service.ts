import { collection, getDocs } from "firebase/firestore"
import { db } from "../firebase"
import type { BusinessCategory } from "../types"

export class CategoryService {
    // Category operations
    static async getCategories(): Promise<BusinessCategory[]> {
      try {
        // Simple query without compound filtering to avoid index requirements
        const snapshot = await getDocs(collection(db, "business_categories"))
        const categories = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            category_id: doc.data().category_id,
            name: doc.data().name,
            image: doc.data().image || doc.data().icon_url || "",
            status: doc.data().status,
            sort_order: doc.data().sort_order || 0,
          }))
          .filter((category) => category.status === "active") // Filter in memory
          .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically by name
  
        return categories
      } catch (error) {
        console.error("Error fetching categories:", error)
        return []
      }
    }
  
    static async getCategory(categoryId: string): Promise<BusinessCategory | null> {
      try {
        // Get all categories and find the one we need in memory
        const snapshot = await getDocs(collection(db, "business_categories"))
        const category = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            category_id: doc.data().category_id,
            name: doc.data().name,
            image: doc.data().image || doc.data().icon_url || "",
            status: doc.data().status,
            sort_order: doc.data().sort_order || 0,
          }))
          .find((cat) => cat.category_id === categoryId)
  
        return category || null
      } catch (error) {
        console.error("Error fetching category:", error)
        return null
      }
    }
    
}