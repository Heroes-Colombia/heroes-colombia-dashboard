import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    limit,
    Timestamp,
  } from "firebase/firestore"
import { db } from "../firebase"
import { BusinessService } from "../services/business-service"

export class LocationService {

    // Location operations (subcollection under businesses)
    static async getBusinessLocations(businessId: string): Promise<any[]> {
      try {
        const locationsRef = collection(db, "businesses", businessId, "locations")
        const snapshot = await getDocs(locationsRef)
        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      } catch (error) {
        console.error("Error fetching business locations:", error)
        return []
      }
    }
  
    static async getBusinessLocation(businessId: string, locationId: string): Promise<any | null> {
      try {
        const locationRef = doc(db, "businesses", businessId, "locations", locationId)
        const docSnap = await getDoc(locationRef)
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
      } catch (error) {
        console.error("Error fetching location:", error)
        return null
      }
    }
  
    static async createLocation(businessId: string, locationData: any): Promise<string | null> {
      try {
        const locationsRef = collection(db, "businesses", businessId, "locations")
        const docRef = await addDoc(locationsRef, {
          ...locationData,
          created_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        })
        return docRef.id
      } catch (error) {
        console.error("Error creating location:", error)
        return null
      }
    }
  
    static async updateLocation(businessId: string, locationId: string, data: any): Promise<boolean> {
      try {
        const locationRef = doc(db, "businesses", businessId, "locations", locationId)
        await updateDoc(locationRef, {
          ...data,
          updated_at: Timestamp.now(),
        })
        return true
      } catch (error) {
        console.error("Error updating location:", error)
        return false
      }
    }
  
    static async deleteLocation(businessId: string, locationId: string): Promise<boolean> {
      try {
        const locationRef = doc(db, "businesses", businessId, "locations", locationId)
        await deleteDoc(locationRef)
        return true
      } catch (error) {
        console.error("Error deleting location:", error)
        return false
      }
    }
  
    static async setPrimaryLocation(businessId: string, locationId: string): Promise<boolean> {
      try {
        // 1. Get the location to be set as primary
        const primaryLocation = await this.getBusinessLocation(businessId, locationId)
        if (!primaryLocation) return false
  
        // 2. Get all locations to unset any existing primary
        const allLocations = await this.getBusinessLocations(businessId)
  
        // 3. Update all locations to set is_primary = false except the new primary
        const updatePromises = allLocations.map((loc) => {
          if (loc.id === locationId) {
            return this.updateLocation(businessId, loc.id, { is_primary: true })
          } else if (loc.is_primary) {
            return this.updateLocation(businessId, loc.id, { is_primary: false })
          }
          return Promise.resolve(true)
        })
  
        await Promise.all(updatePromises)
  
        // 4. Sync primary location data to parent business document
        if (primaryLocation.location && primaryLocation.address) {
          await BusinessService.updateBusiness(businessId, {
            location: primaryLocation.location,
            address: primaryLocation.address,
            geo_hash: primaryLocation.geo_hash,
          })
        }
  
        return true
      } catch (error) {
        console.error("Error setting primary location:", error)
        return false
      }
    }    
}