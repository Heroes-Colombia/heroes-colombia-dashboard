

export class UserService {
  // Analytics operations
  async getAnalytics(businessId?: string, dateRange?: { start: Date; end: Date }) {
    const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    const endDate = dateRange?.end || new Date()

    // Get redemptions for the period
    const redemptions = await this.getRedemptions(businessId, {
      startDate,
      endDate,
      limit: 1000,
    })

    // Get promotions
    const promotions = await this.getPromotions(businessId, { limit: 1000 })

    // Calculate metrics
    const totalRedemptions = redemptions.length
    const totalRevenue = redemptions.reduce((sum, r) => sum + r.amount, 0)
    const activePromotions = promotions.filter((p) => p.isActive).length
    const averageRedemptionValue = totalRedemptions > 0 ? totalRevenue / totalRedemptions : 0

    return {
      totalRedemptions,
      totalRevenue,
      activePromotions,
      averageRedemptionValue,
      redemptions,
      promotions,
    }
  }
}