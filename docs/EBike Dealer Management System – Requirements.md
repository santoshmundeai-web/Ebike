# EBike Dealer Management System – Requirements

Oct 15, 2026 · @Prutha

## 1. Overview

We will build a cloud-based, subscription (SaaS) dealer management system for e-bike showrooms in India. It will cover sales, inventory, service and customers in one place. Our own showroom is the first customer and pilot site. After that, the product opens to small, mid-size and large dealers.

**Goals**

- Replace paper registers and Excel with one system for sales, stock and service.
- Increase repeat service revenue through automatic service reminders.
- Give owners a daily view of sales, collections and stock from their phone.
- Become a recurring-revenue product, sold on monthly or yearly plans.

**Target customers**

| Segment              | Typical size            | Main need                                                |
| -------------------- | ----------------------- | -------------------------------------------------------- |
| Small showroom       | 1 outlet, 1–3 staff     | Simple billing, stock and service records on mobile      |
| Mid-size dealer      | 1–2 outlets, 4–10 staff | Staff roles, CRM, warranty claims, GST reports           |
| Large / multi-branch | 3+ outlets, 10+ staff   | Branch control, stock transfers, integrations, analytics |

**In scope:** sales and billing, inventory, service and maintenance, CRM, staff, reports, and the SaaS platform (tenants, plans, billing, super admin).

**Out of scope for now:** the vehicle manufacturing side, a full accounting ledger (we export to Tally or Zoho instead), and native IoT hardware. The tech stack is not decided yet; this document stays technology-neutral.

## 2. User roles and permissions

Each showroom (tenant) manages its own users. Roles come with default permissions that the dealer owner can adjust. One platform-level role, Super Admin, belongs to us.

| Role            | Level         | Can do                                                                                                                   |
| --------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Super Admin     | Platform (us) | Manage all tenants, plans, billing, master catalogue, support; no access to tenant data without a logged support request |
| Dealer Owner    | Tenant        | Everything in their showroom: settings, users, branches, reports, subscription                                           |
| Branch Manager  | Branch        | Sales, stock, service and reports for their branch; approve discounts and stock transfers                                |
| Sales Executive | Branch        | Leads, test rides, quotations, bookings, invoices; no cost price or profit view                                          |
| Service Advisor | Branch        | Create job cards, estimates, customer approvals, service invoices                                                        |
| Technician      | Branch        | See assigned jobs, update work done, parts used, status; mobile-friendly                                                 |
| Accountant      | Tenant        | Payments, outstanding, expenses, GST reports and exports                                                                 |
| Customer        | External      | View own bikes, service history, invoices, book service (Phase 3 portal)                                                 |

**Rules**

- A user can belong to one or more branches.
- Cost price, margins and profit reports are visible only to Owner, Branch Manager and Accountant by default.
- Discounts above a limit set by the owner need manager approval.
- Every create, edit and delete on invoices, payments and stock is recorded in an audit log.

## 3. Functional requirements

Requirements are grouped by module and tagged with a release phase: MVP (Phase 1), Phase 2 or Phase 3. The IDs are referenced in the task document.

### 3.1 Sales and billing

| ID     | Requirement                                                                      | Phase   |
| ------ | -------------------------------------------------------------------------------- | ------- |
| SAL-01 | Create and search customers (name, phone, address, ID proof, source)             | MVP     |
| SAL-02 | Create quotations with model, variant, colour, price, accessories and discount   | MVP     |
| SAL-03 | Convert quotation to booking with advance payment and expected delivery date     | MVP     |
| SAL-04 | Generate GST tax invoice with chassis, motor, battery and charger serial numbers | MVP     |
| SAL-05 | Record payments: cash, UPI, card, bank transfer, finance; allow part-payments    | MVP     |
| SAL-06 | Print or share invoice as PDF and on WhatsApp                                    | MVP     |
| SAL-07 | Delivery checklist with customer signature and photos                            | Phase 2 |
| SAL-08 | Track finance/EMI cases: financier, loan amount, approval status                 | Phase 2 |
| SAL-09 | Exchange / trade-in of old vehicle with valuation                                | Phase 2 |
| SAL-10 | RTO registration status for high-speed models                                    | Phase 2 |
| SAL-11 | Subsidy tracking (central or state schemes) and claim status                     | Phase 2 |
| SAL-12 | Sale of extended warranty and AMC packages                                       | Phase 2 |
| SAL-13 | Credit notes and sales returns                                                   | MVP     |

### 3.2 Inventory

| ID     | Requirement                                                                               | Phase   |
| ------ | ----------------------------------------------------------------------------------------- | ------- |
| INV-01 | Model catalogue: brand, model, variant, colour, battery type, range, price                | MVP     |
| INV-02 | Add each bike as a unique unit by chassis number, with motor, battery and charger serials | MVP     |
| INV-03 | Unit status: in stock, booked, sold, in transit, demo                                     | MVP     |
| INV-04 | Spare parts and accessories with quantity, cost and selling price                         | MVP     |
| INV-05 | Low-stock alerts based on a reorder level per item                                        | MVP     |
| INV-06 | Purchase entries from suppliers / OEM with purchase invoice                               | MVP     |
| INV-07 | Bulk import of stock from Excel/CSV                                                       | MVP     |
| INV-08 | Purchase orders to suppliers                                                              | Phase 2 |
| INV-09 | Stock transfer between branches                                                           | Phase 3 |
| INV-10 | Barcode / QR labels for parts and bikes                                                   | Phase 2 |
| INV-11 | Stock ageing and slow-moving stock report                                                 | Phase 2 |

### 3.3 Service and maintenance

| ID     | Requirement                                                                                        | Phase   |
| ------ | -------------------------------------------------------------------------------------------------- | ------- |
| SRV-01 | Create job card: bike, odometer, complaints, photos, service type (free, paid, warranty, accident) | MVP     |
| SRV-02 | Assign technician; track status: open, in progress, waiting for parts, ready, delivered            | MVP     |
| SRV-03 | Add parts and labour to the job; parts reduce stock automatically                                  | MVP     |
| SRV-04 | Estimate shared with the customer for approval before work starts                                  | Phase 2 |
| SRV-05 | Service invoice with GST                                                                           | MVP     |
| SRV-06 | Complete service history per bike, searchable by chassis number or phone                           | MVP     |
| SRV-07 | Free-service schedule per model (by km or months), set by the dealer                               | MVP     |
| SRV-08 | Automatic service-due reminders by SMS/WhatsApp                                                    | MVP     |
| SRV-09 | Battery health log: voltage, charge cycles, capacity check, replacement                            | Phase 2 |
| SRV-10 | Warranty tracking per component (motor, battery, controller, charger) with expiry dates            | MVP     |
| SRV-11 | Warranty claims to OEM with status and reimbursement tracking                                      | Phase 2 |
| SRV-12 | Pick-up / drop and roadside assistance requests                                                    | Phase 3 |
| SRV-13 | QR code on each bike that opens its service history                                                | Phase 3 |

### 3.4 Customer relationship (CRM)

| ID     | Requirement                                                                           | Phase   |
| ------ | ------------------------------------------------------------------------------------- | ------- |
| CRM-01 | Capture enquiries/leads with source (walk-in, phone, social, referral)                | Phase 2 |
| CRM-02 | Test-ride booking and follow-up reminders for sales staff                             | Phase 2 |
| CRM-03 | Lead status pipeline: new, contacted, test ride, negotiation, won, lost (with reason) | Phase 2 |
| CRM-04 | Feedback request after sale and after service, with rating                            | Phase 2 |
| CRM-05 | Referral tracking and rewards                                                         | Phase 3 |
| CRM-06 | Bulk WhatsApp/SMS campaigns to customer segments                                      | Phase 3 |
| CRM-07 | Customer portal / app: own bikes, invoices, service booking                           | Phase 3 |

### 3.5 Finance and reports

| ID     | Requirement                                                       | Phase   |
| ------ | ----------------------------------------------------------------- | ------- |
| FIN-01 | Owner dashboard: today's sales, collections, open jobs, low stock | MVP     |
| FIN-02 | Sales report by date, model, salesperson and branch               | MVP     |
| FIN-03 | Service revenue report by date, technician and service type       | MVP     |
| FIN-04 | Outstanding payments and due follow-ups                           | MVP     |
| FIN-05 | Daily expense entry (rent, salary, electricity, etc.)             | Phase 2 |
| FIN-06 | GST reports: sales register, HSN summary, GSTR-1 export           | Phase 2 |
| FIN-07 | Profit report by model and by bike (needs cost price)             | Phase 2 |
| FIN-08 | Export any report to Excel and PDF                                | MVP     |

### 3.6 Staff and operations

| ID     | Requirement                                                          | Phase   |
| ------ | -------------------------------------------------------------------- | ------- |
| STF-01 | Add staff users and assign roles and branches                        | MVP     |
| STF-02 | Sales targets and achievement per salesperson                        | Phase 2 |
| STF-03 | Incentive/commission calculation                                     | Phase 3 |
| STF-04 | Technician workload and average job time                             | Phase 2 |
| STF-05 | Showroom settings: name, logo, GSTIN, address, invoice prefix, terms | MVP     |

## 4. SaaS platform requirements

Multi-tenancy is built from day one, even while only our showroom uses the system. Adding it later would mean a costly rewrite.

| ID      | Requirement                                                                                               | Phase   |
| ------- | --------------------------------------------------------------------------------------------------------- | ------- |
| SAAS-01 | Multi-tenant data model: every record belongs to a tenant; no tenant can see another's data               | MVP     |
| SAAS-02 | A tenant can have one or more branches; data filtered by branch                                           | MVP     |
| SAAS-03 | Self-service signup with phone/email OTP and showroom details                                             | Phase 2 |
| SAAS-04 | Onboarding wizard: GSTIN, logo, invoice format, models, service schedule, staff                           | Phase 2 |
| SAAS-05 | Excel import templates for customers, stock and past service records                                      | Phase 2 |
| SAAS-06 | Master catalogue of common e-bike brands, models and parts that tenants can copy                          | Phase 2 |
| SAAS-07 | Subscription plans with feature flags and limits (users, branches, invoices, message credits)             | Phase 2 |
| SAAS-08 | Free trial (e.g. 14 days) without card                                                                    | Phase 2 |
| SAAS-09 | Recurring billing through an Indian payment gateway; monthly and yearly cycles; GST invoice to the dealer | Phase 2 |
| SAAS-10 | Upgrade, downgrade and cancel; prorated charges                                                           | Phase 2 |
| SAAS-11 | Payment failure handling: reminders, grace period, then read-only mode (data never deleted on lapse)      | Phase 2 |
| SAAS-12 | Super admin panel: tenants list, plan, status, usage, MRR, churn, login-as with consent and audit         | Phase 2 |
| SAAS-13 | Add-on purchases: WhatsApp/SMS credit packs, extra branches, extra users                                  | Phase 3 |
| SAAS-14 | In-app help, support tickets and announcements                                                            | Phase 2 |
| SAAS-15 | Full data export for the tenant (Excel/CSV) at any time                                                   | Phase 2 |
| SAAS-16 | Public API and webhooks for Enterprise plan                                                               | Phase 3 |

**Draft plan tiers** (prices to be decided after pilot feedback)

| Plan    | For                  | Limits                        | Key features                                                                                       |
| ------- | -------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------- |
| Starter | Small showroom       | 1 branch, 3 users             | Sales, billing, stock, job cards, service history, reminders, basic reports                        |
| Growth  | Mid-size dealer      | 2 branches, 10 users          | Starter + CRM, warranty claims, GST reports, purchase orders, staff targets                        |
| Pro     | Large / multi-branch | Unlimited branches, 25+ users | Growth + stock transfers, customer portal, integrations, advanced analytics, API, priority support |

## 5. Non-functional requirements

The system must work well on a mid-range Android phone over a 4G connection, because most small dealers will run it from a phone.

| ID     | Area           | Requirement                                                                                       |
| ------ | -------------- | ------------------------------------------------------------------------------------------------- |
| NFR-01 | Devices        | Responsive web app usable on phone, tablet and desktop; installable as a home-screen app (PWA)    |
| NFR-02 | Performance    | Common screens load in under 2 seconds on 4G; search results in under 1 second for 50,000 records |
| NFR-03 | Availability   | 99.5% uptime target; planned maintenance outside showroom hours                                   |
| NFR-04 | Offline        | Billing and job card screens keep working through short network drops and sync later (Phase 2)    |
| NFR-05 | Security       | HTTPS everywhere, encrypted passwords, OTP login option, role-based access, session timeout       |
| NFR-06 | Data isolation | Tenant isolation enforced at the data layer and covered by automated tests                        |
| NFR-07 | Backups        | Automatic daily backups kept for 30 days; restore tested every quarter                            |
| NFR-08 | Audit          | Audit log of who changed what and when, for invoices, payments, stock and settings                |
| NFR-09 | Privacy        | Customer data handled in line with India's DPDP Act 2023; customer data deletion on request       |
| NFR-10 | Language       | English first; Hindi and regional languages (e.g. Marathi, Gujarati) via translation files        |
| NFR-11 | Scalability    | Support at least 1,000 tenants without redesign                                                   |
| NFR-12 | Usability      | A new salesperson can create an invoice after a 15-minute walkthrough                             |

## 6. Integrations and compliance

The MVP needs only messaging and PDF sharing; the rest follow in later phases. The rules below should be checked with a CA before launch.

| Integration                                 | Purpose                                                      | Phase   |
| ------------------------------------------- | ------------------------------------------------------------ | ------- |
| WhatsApp Business API / SMS gateway         | Invoices, service reminders, OTP, campaigns                  | MVP     |
| Payment gateway (UPI, cards, subscriptions) | Dealer subscription billing; optional customer payment links | Phase 2 |
| Tally / Zoho Books export                   | Accounting entries for the dealer's CA                       | Phase 3 |
| GST e-invoicing (IRN)                       | Needed only for dealers above the e-invoice turnover limit   | Phase 3 |
| OEM / manufacturer portals                  | Warranty claims, stock orders (manual at first)              | Phase 3 |
| IoT / GPS telematics                        | Battery state and fault codes from connected bikes           | Phase 3 |

**Compliance points**

- GST invoice format: GSTIN, HSN codes, correct tax rate per item (bikes, batteries, parts and labour can differ), place of supply.
- Invoice numbers must be sequential per financial year and per branch, with no gaps.
- Low-speed e-bikes (up to 25 km/h) do not need RTO registration; high-speed models do, so registration tracking applies only to those models.
- Subsidy rules change often; the subsidy fields must be configurable, not hard-coded.
- Our own SaaS invoices to dealers must carry GST.

## 7. Release phases and open questions

The MVP runs at our own showroom first; only after it replaces paper records do we open signups to other dealers.

&#91;embedded content: release roadmap · 3 phases, 2 gates\]

The gate criteria are proposals and can be changed. Each requirement's phase is listed in its table in section 3 and 4.

**Open questions**

- Which e-bike brands and models does our showroom sell today, and are they low-speed, high-speed or both?
- Should the MVP include customer-facing payment links, or record payments only?
- Which messaging channel first: WhatsApp Business API (paid per message) or SMS?
- Pricing per plan: monthly vs yearly, and the price range small dealers will accept.
- Product name and brand for the SaaS.
- Who will build it: in-house developer, freelancer or agency? This decides the tech stack.
- Which existing records (Excel, registers) need to be migrated for our showroom?
