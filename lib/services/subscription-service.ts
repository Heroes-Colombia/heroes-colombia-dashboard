import {
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore"
import { db } from "../firebase"
import type {
  BusinessSubscription,
  BusinessProfile,
  SubscriptionStatus,
  SubscriptionPlan,
  SubscriptionType,
  BillingPeriod,
} from "../types"

// ============================================================================
// Types for Service Methods
// ============================================================================

export interface CreateTrialSubscriptionData {
  amount?: number
  payerEmail?: string
}

export interface ActivateSubscriptionData {
  plan: SubscriptionPlan
  billingPeriod: BillingPeriod
  amount: number
  mercadopagoSubscriptionId?: string
  mercadopagoPayerId?: number
  mercadopagoPayerEmail?: string
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  nextPaymentDate?: Date
}

export interface SubscriptionInfo {
  subscription: BusinessSubscription | null
  isActive: boolean
  isTrialExpired: boolean
  isFounder: boolean
  isPendingPayment: boolean
  daysUntilExpiration: number | null
  canCreateContent: boolean
}

// ============================================================================
// Subscription Service
// ============================================================================

export class SubscriptionService {
  // --------------------------------------------------------------------------
  // Read Operations
  // --------------------------------------------------------------------------

  /**
   * Get subscription data for a business
   */
  static async getSubscription(businessId: string): Promise<BusinessSubscription | null> {
    try {
      const docRef = doc(db, "businesses", businessId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return null
      }

      const data = docSnap.data()
      return data.subscription || null
    } catch (error) {
      console.error("[SubscriptionService] Error fetching subscription:", error)
      return null
    }
  }

  /**
   * Get full subscription info with computed status
   */
  static async getSubscriptionInfo(businessId: string): Promise<SubscriptionInfo> {
    const subscription = await this.getSubscription(businessId)

    if (!subscription) {
      return {
        subscription: null,
        isActive: false,
        isTrialExpired: false,
        isFounder: false,
        isPendingPayment: false,
        daysUntilExpiration: null,
        canCreateContent: false,
      }
    }

    const now = new Date()
    const isPendingPayment = subscription.status === "pending_payment"
    const isTrialExpired = this.checkTrialExpired(subscription, now)
    const isFounder = subscription.is_founder
    const isActive = this.checkIsActive(subscription, now)
    const daysUntilExpiration = this.calculateDaysUntilExpiration(subscription, now)

    // Can create content if subscription is active (trial or paid) and not expired
    const canCreateContent = isActive && !isPendingPayment && !isTrialExpired

    return {
      subscription,
      isActive,
      isTrialExpired,
      isFounder,
      isPendingPayment,
      daysUntilExpiration,
      canCreateContent,
    }
  }

  /**
   * Check if a subscription is currently active
   */
  static async isSubscriptionActive(businessId: string): Promise<boolean> {
    const subscription = await this.getSubscription(businessId)
    if (!subscription) return false
    return this.checkIsActive(subscription, new Date())
  }

  /**
   * Check if trial is expired
   */
  static async isTrialExpired(businessId: string): Promise<boolean> {
    const subscription = await this.getSubscription(businessId)
    if (!subscription) return false
    return this.checkTrialExpired(subscription, new Date())
  }

  /**
   * Get days until subscription/trial expires
   */
  static async getDaysUntilExpiration(businessId: string): Promise<number | null> {
    const subscription = await this.getSubscription(businessId)
    if (!subscription) return null
    return this.calculateDaysUntilExpiration(subscription, new Date())
  }

  // --------------------------------------------------------------------------
  // Write Operations
  // --------------------------------------------------------------------------

  /**
   * Create initial trial subscription (pending_payment status)
   * Called when business registers but hasn't paid yet
   */
  static async createPendingTrialSubscription(
    businessId: string,
    data?: CreateTrialSubscriptionData
  ): Promise<void> {
    const now = Timestamp.now()

    const subscription: BusinessSubscription = {
      type: "trial",
      status: "pending_payment",
      plan: "trial",
      billing_period: null,
      start_date: null, // Will be set when payment completes
      end_date: null,
      current_period_start: null,
      current_period_end: null,
      next_payment_date: null,
      last_payment_date: null,
      amount: data?.amount || 20000, // Default trial price
      currency: "COP",
      mercadopago_subscription_id: null,
      mercadopago_payer_id: null,
      mercadopago_payer_email: data?.payerEmail || null,
      is_founder: false,
      created_at: now,
      updated_at: now,
    }

    await this.updateSubscription(businessId, subscription)
  }

  /**
   * Activate trial after payment is confirmed
   * Sets start_date to now and end_date to 2 months later
   */
  static async activateTrial(
    businessId: string,
    payerEmail?: string
  ): Promise<void> {
    const now = new Date()
    const endDate = new Date(now)
    endDate.setMonth(endDate.getMonth() + 2) // 2 months trial

    const subscription = await this.getSubscription(businessId)
    if (!subscription) {
      throw new Error("No subscription found for business")
    }

    const updatedSubscription: Partial<BusinessSubscription> = {
      status: "trial",
      start_date: Timestamp.fromDate(now),
      end_date: Timestamp.fromDate(endDate),
      last_payment_date: Timestamp.fromDate(now),
      mercadopago_payer_email: payerEmail || subscription.mercadopago_payer_email,
      updated_at: Timestamp.now(),
    }

    await this.updateSubscriptionFields(businessId, updatedSubscription)

    // Also update the legacy fields for backward compatibility
    await this.updateLegacyFields(businessId, "trial", "enterprise")
  }

  /**
   * Activate a paid subscription (Fundador, Basico, Pro, Enterprise)
   */
  static async activateSubscription(
    businessId: string,
    data: ActivateSubscriptionData
  ): Promise<void> {
    const now = Timestamp.now()

    const subscriptionData: Partial<BusinessSubscription> = {
      type: "mercadopago",
      status: "active",
      plan: data.plan,
      billing_period: data.billingPeriod,
      start_date: data.currentPeriodStart
        ? Timestamp.fromDate(data.currentPeriodStart)
        : now,
      end_date: null, // Active subscriptions don't have end dates
      current_period_start: data.currentPeriodStart
        ? Timestamp.fromDate(data.currentPeriodStart)
        : now,
      current_period_end: data.currentPeriodEnd
        ? Timestamp.fromDate(data.currentPeriodEnd)
        : null,
      next_payment_date: data.nextPaymentDate
        ? Timestamp.fromDate(data.nextPaymentDate)
        : null,
      last_payment_date: now,
      amount: data.amount,
      mercadopago_subscription_id: data.mercadopagoSubscriptionId || null,
      mercadopago_payer_id: data.mercadopagoPayerId || null,
      mercadopago_payer_email: data.mercadopagoPayerEmail || null,
      is_founder: data.plan === "fundador",
      updated_at: now,
    }

    await this.updateSubscriptionFields(businessId, subscriptionData)

    // Update legacy fields
    await this.updateLegacyFields(businessId, "active", data.plan)
  }

  /**
   * Update subscription status
   */
  static async updateSubscriptionStatus(
    businessId: string,
    status: SubscriptionStatus
  ): Promise<void> {
    await this.updateSubscriptionFields(businessId, {
      status,
      updated_at: Timestamp.now(),
    })

    // Update legacy field
    const docRef = doc(db, "businesses", businessId)
    await updateDoc(docRef, {
      subscription_status: status,
      updated_at: Timestamp.now(),
    })
  }

  /**
   * Extend trial by setting a new end date
   */
  static async extendTrial(businessId: string, newEndDate: Date): Promise<void> {
    await this.updateSubscriptionFields(businessId, {
      end_date: Timestamp.fromDate(newEndDate),
      updated_at: Timestamp.now(),
    })
  }

  /**
   * Mark subscription as cancelled
   */
  static async cancelSubscription(businessId: string): Promise<void> {
    const now = Timestamp.now()

    await this.updateSubscriptionFields(businessId, {
      status: "cancelled",
      updated_at: now,
    })

    await this.updateLegacyFields(businessId, "cancelled")
  }

  /**
   * Mark trial/subscription as expired
   */
  static async expireSubscription(businessId: string): Promise<void> {
    const now = Timestamp.now()

    await this.updateSubscriptionFields(businessId, {
      status: "expired",
      updated_at: now,
    })

    await this.updateLegacyFields(businessId, "expired")
  }

  // --------------------------------------------------------------------------
  // Batch Operations
  // --------------------------------------------------------------------------

  /**
   * Find and expire all overdue trials
   * Returns count of expired subscriptions
   */
  static async expireOverdueTrials(): Promise<number> {
    try {
      const snapshot = await getDocs(collection(db, "businesses"))
      const now = new Date()
      let expiredCount = 0

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data()
        const subscription = data.subscription as BusinessSubscription | undefined

        if (!subscription) continue
        if (subscription.status !== "trial") continue
        if (!subscription.end_date) continue

        const endDate = subscription.end_date.toDate()
        if (endDate < now) {
          await this.expireSubscription(docSnap.id)
          expiredCount++
        }
      }

      return expiredCount
    } catch (error) {
      console.error("[SubscriptionService] Error expiring overdue trials:", error)
      return 0
    }
  }

  /**
   * Get businesses with trials expiring within N days
   */
  static async getExpiringTrials(daysAhead: number): Promise<BusinessProfile[]> {
    try {
      const snapshot = await getDocs(collection(db, "businesses"))
      const now = new Date()
      const futureDate = new Date(now)
      futureDate.setDate(futureDate.getDate() + daysAhead)

      const expiringBusinesses: BusinessProfile[] = []

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data()
        const subscription = data.subscription as BusinessSubscription | undefined

        if (!subscription) continue
        if (subscription.status !== "trial") continue
        if (!subscription.end_date) continue

        const endDate = subscription.end_date.toDate()

        // Check if expiring within the window (after now, before futureDate)
        if (endDate > now && endDate <= futureDate) {
          expiringBusinesses.push({
            id: docSnap.id,
            ...data,
          } as BusinessProfile)
        }
      }

      return expiringBusinesses
    } catch (error) {
      console.error("[SubscriptionService] Error getting expiring trials:", error)
      return []
    }
  }

  /**
   * Get all businesses with pending_payment status
   */
  static async getPendingPaymentBusinesses(): Promise<BusinessProfile[]> {
    try {
      const snapshot = await getDocs(collection(db, "businesses"))
      const pendingBusinesses: BusinessProfile[] = []

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data()
        const subscription = data.subscription as BusinessSubscription | undefined

        if (subscription?.status === "pending_payment") {
          pendingBusinesses.push({
            id: docSnap.id,
            ...data,
          } as BusinessProfile)
        }
      }

      return pendingBusinesses
    } catch (error) {
      console.error("[SubscriptionService] Error getting pending payment businesses:", error)
      return []
    }
  }

  // --------------------------------------------------------------------------
  // Helper Methods (Private)
  // --------------------------------------------------------------------------

  private static checkIsActive(subscription: BusinessSubscription, now: Date): boolean {
    // pending_payment is not active
    if (subscription.status === "pending_payment") {
      return false
    }

    // expired or cancelled are not active
    if (subscription.status === "expired" || subscription.status === "cancelled") {
      return false
    }

    // For trial, check if end_date has passed
    if (subscription.status === "trial" && subscription.end_date) {
      const endDate = subscription.end_date.toDate()
      if (endDate < now) {
        return false
      }
    }

    // active, trial (not expired), past_due are considered "active"
    return true
  }

  private static checkTrialExpired(subscription: BusinessSubscription, now: Date): boolean {
    if (subscription.type !== "trial") {
      return false
    }

    if (subscription.status === "expired") {
      return true
    }

    if (subscription.status === "trial" && subscription.end_date) {
      const endDate = subscription.end_date.toDate()
      return endDate < now
    }

    return false
  }

  private static calculateDaysUntilExpiration(
    subscription: BusinessSubscription,
    now: Date
  ): number | null {
    // For trials, use end_date
    if (subscription.type === "trial" && subscription.end_date) {
      const endDate = subscription.end_date.toDate()
      const diffTime = endDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    }

    // For MercadoPago subscriptions, use current_period_end
    if (subscription.type === "mercadopago" && subscription.current_period_end) {
      const endDate = subscription.current_period_end.toDate()
      const diffTime = endDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    }

    return null
  }

  private static async updateSubscription(
    businessId: string,
    subscription: BusinessSubscription
  ): Promise<void> {
    const docRef = doc(db, "businesses", businessId)
    await updateDoc(docRef, {
      subscription,
      updated_at: Timestamp.now(),
    })
  }

  private static async updateSubscriptionFields(
    businessId: string,
    fields: Partial<BusinessSubscription>
  ): Promise<void> {
    const docRef = doc(db, "businesses", businessId)

    // Build update object with subscription. prefix
    const updateData: Record<string, unknown> = {
      updated_at: Timestamp.now(),
    }

    for (const [key, value] of Object.entries(fields)) {
      updateData[`subscription.${key}`] = value
    }

    await updateDoc(docRef, updateData)
  }

  private static async updateLegacyFields(
    businessId: string,
    status: SubscriptionStatus,
    plan?: SubscriptionPlan | string
  ): Promise<void> {
    const docRef = doc(db, "businesses", businessId)
    const updateData: Record<string, unknown> = {
      subscription_status: status,
      updated_at: Timestamp.now(),
    }

    // Map subscription plan to legacy PlanType
    if (plan) {
      const legacyPlan = plan === "trial" ? "enterprise" : plan
      updateData.plan = legacyPlan
    }

    await updateDoc(docRef, updateData)
  }
}
