# HEROES COLOMBIA DASHBOARD STRUCTURE (DETAILED SPEC)
# Goal: Generate a responsive web dashboard (desktop + mobile web).
# Language: Spanish-first UI, with English fallback.
# Roles:
# - Business Users (companies)
# - Admins (platform operators)
# Payments: Mercado Pago. Email: MailerLite. Storage/DB/Auth: Firebase.

===================================================
AUTHENTICATION & ACCESS
===================================================
- Businesses: Firebase (Email/password or Google/Facebook SSO).
- Admins: Email/password only.
- Business roles: Owner, Manager, Staff.
- Admin roles: Super Admin.


===================================================
BUSINESS DASHBOARD (/business)
===================================================


/dashboard (Business Overview)
  - Welcome summary (plan name, renewal date, quick upgrade button)
  - KPIs (based on plan):
    * Gratis/Básico: Active promotions, total impressions, total redemptions
    * Pro: + Conversion rate, revenue attributed, user demographics
    * Enterprise: + Heatmaps, cohort analysis, benchmarking vs peers
  - Graphs:
    * Trendline: Impressions/views/redemptions over time
    * Funnel: Impressions → Views → Saves → Redemptions
    * Top performing promotions (ranked by engagement)
  - Notifications panel (plan reminders, promotion status, tips)

/promotions
  - Featured Promotions: Pro & Enterprise promotions appear in featured section.
  - Create promotion flow:
    * Fields: title, description, type (percentage, fixed, BOGO, free shipping, flash deal)
    * Duration: start/end dates
    * Limits: Gratis/Básico = 3 active/month; Pro & Enterprise = unlimited.
    * Preview promotion
    * Save draft or publish
  - Manage promotions:
    * List with filters (active, expired, draft)
    * Edit, duplicate, deactivate
    * Promotion details with stats (views, saves, redemptions, conversion %)
  - Digital card:
    * Businesses can flag promotion for “Digital Card Eligible”
    * Note: Actual pass generation happens in the APP, not here


/redemptions
  - Manual check-in process
    * Staff enters promo ID + verifies user ID physically
    * Mark as redeemed in dashboard
  - Redemption history
    * Search/filter by promotion, date, staff
    * Export CSV/PDF


/analytics
  - Gratis/Básico: Impressions, Views, Redemptions.
  - Pro: + Conversion rate, Revenue attribution, Demographics (age, rank, city).
  - Enterprise: + Heatmaps, Cohort analysis, Benchmarking, A/B testing.
  - Visuals: Line charts, funnels, heatmaps.
  - Export CSV/PDF; schedule weekly/monthly reports.
  - Filters: by promotion, by date range, by location


/billing
  - Current plan details (name, price, renewal date).
  - Manage subscription:
    * Upgrade/downgrade plans (side-by-side comparison table)
    * Pay-as-you-go promotions option
    * Payment methods (via Mercado Pago)
    * Billing history (invoices, receipts)
    * Cancel subscription (at renewal)
  - Plan tiers:
    * Básico, Pro, Enterprise, Pay-as-you-go (COP pricing defined)
  - Gratis plan: Publish promotion pay-per-use (COP $10,000 each).


/locations
  - Physical location (address, geo pin, hours).
  - Online only (URL, delivery zones, contact info).
  - Limits: Gratis/Básico = 1, Pro = 5, Enterprise = unlimited.


/team
  - Roles: Owner (full), Manager (manage promotions/analytics), Staff (redemptions).
  - Invite users via email
  - Manage permissions


/settings
  - Business profile (name, logo, categories).
  - Notification preferences.
  - Support (Email for Gratis/Básico, Email+Chat for Pro, SLA for Enterprise).


===================================================
ADMIN DASHBOARD (/admin)
===================================================


/dashboard
    - KPIs:
      * Total businesses by tier
      * Active promotions (today, this month)
      * User verification success/failure %
      * Revenue metrics (MRR, ARPU, churn)
      * DAU/MAU of users
      * Redemption totals
      * Top 10 businesses by engagement
    - Graphs: platform trends, geo heatmap


/businesses
  - Business approval queue
  - View submitted documents (OCR + manual override)
  - Approve/reject/flag
  - Manage business profiles, plans, billing


/users
  - Verification queue (OCR failed cases)
  - Approve/reject manually
  - User search & management (ban, reinstate)


/promotions
  - Monitor active promotions
  - Flagged content moderation
  - Search/filter by business, category, status


/plans
  - Manage subscription tiers
  - Configure promotion/location/analytics limits
  - Custom pricing for Enterprise clients


/analytics
  - Global KPIs: impressions, views, redemptions.
  - Plan adoption metrics.
  - Heatmaps of user activity.
  - Export CSV/PDF.


/settings
  - Platform config (branding, language).
  - Integrations MailerLite, Mercado Pago, Firebase
  - Audit logs of admin actions


===================================================
PLANS & PRICING (Business Dashboard -> Billing)
===================================================


| **Plan** | **Precio mensual (COP)** | **Ubicaciones** | **Promociones activas** | **Analítica disponible** | **Soporte** | **Otros beneficios** |
|----------------|---------------------------|-----------------|--------------------------|--------------------------|-------------|----------------------|
| **Gratis** | $0 (solo paga $10,000 por promoción publicada) | 1 | 1 promoción (30 días) | Impresiones, vistas, redenciones | Email | Sin suscripción fija; ideal para empezar |
| **Básico** | $60,000 | 1 | Hasta 3/mes | Impresiones, vistas, redenciones | Email | Perfil estándar de negocio |
| **Pro** | $230,000 | Hasta 5 | Ilimitadas | Básico + tasa de conversión, ingresos atribuidos, demografía | Email + chat | Equipo (dueño, gerente, staff); Prioridad en listados; **Sección destacada en dashboard y promociones** |
| **Enterprise** | Desde $700,000 (custom) | Ilimitadas | Ilimitadas | Pro + heatmaps, cohortes, benchmarking, A/B testing | Dedicado + SLA | API, campañas personalizadas, manager dedicado, patrocinio; **Sección destacada en dashboard y promociones** |


===================================================
GENERAL RULES
===================================================
- Responsive design (desktop + mobile).
- Spanish-first UI with English fallback.
- Multi-location support
- Businesses auto-approved unless flagged.
- Promotions auto-approved unless flagged.
- Digital card generation in APP, not dashboard.
- Pro & Enterprise businesses/promotions highlighted in featured sections.
- Full export/reporting for businesses & admins