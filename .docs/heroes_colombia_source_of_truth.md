# Heroes Colombia – Business Source of Truth (Final Draft)

## Purpose

This document is the single source of truth for **Heroes Colombia**. It defines the business model, value proposition, app functionality, user segments, subscription plans, dashboards, and pricing tiers. It is designed to be clear, non-technical, and usable across platforms, tools, and teams.

---

## Vision & Mission

Heroes Colombia connects **Colombian military personnel and their families** with **local and online businesses** offering exclusive promotions and benefits. The mission is to support the military community while empowering businesses with access to a loyal, verified customer base.

---

## Core Value Propositions

### For Users (Military & Families)

- Access to **exclusive, verified promotions**.
- Assurance that promotions come from trusted businesses.
- Easy discovery via **location-based search** or **online offers**.
- Ability to **store promotions** digitally in the app.

### For Businesses

- Reach a **verified military audience** with high trust.
- Promote services/products through targeted promotions.
- Access to **analytics** that measure campaign impact.
- Flexible subscription plans and options to start small.

### For Admins

- Ensure **trust and quality** in the system.
- Oversee verifications and approvals when necessary.
- Monitor business activity, promotions, and overall performance.

---

## Revenue Model

- **Subscription Plans**: Tiered monthly subscriptions for businesses.
- **Free Plan (Gratis)**: Businesses subscribe for free and only pay when publishing promotions.
- **Enterprise Partnerships**: Custom campaigns and large-scale agreements.

---

## Subscription Plans & Pricing Table

| **Plan**       | **Precio mensual (COP)**                         | **Ubicaciones** | **Promociones activas** | **Analítica disponible**                                                           | **Soporte**    | **Otros beneficios**                                                                                         |
| -------------- | ------------------------------------------------ | --------------- | ----------------------- | ---------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------ |
| **Gratis**     | \$0 (solo paga \$10,000 por promoción publicada) | 1               | 1 promoción (30 días)   | Impresiones, vistas, redenciones                                                   | Email          | Sin suscripción fija; ideal para empezar                                                                     |
| **Básico**     | \$60,000                                         | 1               | Hasta 3/mes             | Impresiones, vistas, redenciones                                                   | Email          | Perfil estándar de negocio                                                                                   |
| **Pro**        | \$230,000                                        | Hasta 5         | Ilimitadas              | Básico + tasa de conversión, ingresos atribuidos, demografía (edad, rango, ciudad) | Email + chat   | Equipo (dueño, gerente, staff); Prioridad en listados; **Sección destacada en dashboard y promociones**      |
| **Enterprise** | Desde \$700,000 (custom)                         | Ilimitadas      | Ilimitadas              | Pro + heatmaps, cohortes, benchmarking, A/B testing                                | Dedicado + SLA | API, campañas personalizadas, manager dedicado, patrocinio; **Sección destacada en dashboard y promociones** |

---

## App Functionality (User Side)

- **Onboarding & Verification**: Users verify their military status with ID.
- **Explore Promotions**: Location-based discovery (map & list view) or online-only offers.
- **Favorites & Saves**: Save promotions to personal list.
- **Redemption**: Show promotion + military ID at business location for manual check-in.
- **Digital Cards**: Users can download promotions as Apple/Google Wallet cards (handled in the app).
- **Notifications**: Alerts for new promotions and saved promotion updates.

---

## Business Dashboard (For Companies)

- **Overview**: Summary of KPIs, active promotions, redemptions, and plan status.
- **Promotions**: Create, edit, schedule, and manage promotions (discounts, BOGO, free shipping, flash deals). Flag for digital card eligibility (generated in the app).
- **Redemptions**: Manual check-in system with redemption history and exports.
- **Analytics**: Metrics vary by plan.
  - Gratis/Básico: Impressions, views, redemptions.
  - Pro: + Conversion rate, revenue attribution, demographics.
  - Enterprise: + Heatmaps, cohort analysis, benchmarking.
- **Billing**: View current plan, invoices, upgrade/downgrade plans, publish pay-per-promotion if Gratis.
- **Locations**: Manage physical or online-only locations (limits vary by plan).
- **Team Management**: Assign roles (owner, manager, staff).
- **Settings**: Update business profile, preferences, support access.
- **Highlighting**: Businesses on **Pro** and **Enterprise** tiers will have:
  - A featured section inside the dashboard highlighting their company.
  - Promotions displayed in a featured section for greater visibility.

---

## Admin Dashboard (For Platform Operators)

- **Overview**: KPIs such as active businesses, promotions, revenue, DAU/MAU, churn, top-performing businesses.
- **Businesses**: Review new business registrations, manage profiles, track plan usage.
- **Users**: Verification queue for failed ID scans, manual approvals, user account management.
- **Promotions**: Monitor promotions, review flagged content.
- **Plans**: Manage and adjust subscription tiers, limits, and enterprise agreements.
- **Analytics**: Global platform performance, heatmaps, exports.
- **Settings**: Manage platform-wide configurations, audit trails, and policies.

---

## Governance & Approval Rules

- **User Verification**: Automated via ID scan; manual review only if scan fails.
- **Business Approval**: Businesses auto-approved unless flagged.
- **Promotions**: Auto-approved unless flagged for moderation.
- **Escalations**: Admins handle exceptions only.

---