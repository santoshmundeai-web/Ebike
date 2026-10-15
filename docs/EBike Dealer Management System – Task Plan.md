# EBike Dealer Management System – Task Plan

Oct 15, 2026 · @Prutha

The work breaks into four phases; each task links to a requirement ID in Doc. Phase 1 is broken down in detail; later phases stay at epic level until Phase 1 is live.

## Phase 0: Setup and decisions

These decisions come before any code; most answer the open questions in the requirements doc.

- [ ] List the brands, models, variants and prices our showroom sells today
- [ ] Collect current paper/Excel formats: invoice, job card, stock register, service register
- [ ] Confirm GST rates and HSN codes for bikes, batteries, parts and labour with our CA
- [ ] Define the free-service schedule per model (km and months)
- [ ] Choose who builds it (in-house, freelancer, agency) and then the tech stack
- [ ] Choose messaging channel and provider (WhatsApp Business API or SMS)
- [ ] Make wireframes for the 10 core screens: login, dashboard, customer, quotation, invoice, stock list, add bike, job card, service history, reports
- [ ] Design the data model with tenant and branch on every record
- [ ] Pick a product name and register the domain

## Phase 1: MVP at our showroom

Phase 1 ends at Gate 1: the system is used daily at our showroom for 4 weeks with no paper backup. Size is a rough effort guide (S = up to 2 days, M = up to a week, L = more than a week) to be re-estimated by the developer.

| #    | Task                                                                                    | Requirement                    | Size | Status      |
| ---- | --------------------------------------------------------------------------------------- | ------------------------------ | ---- | ----------- |
| 1.1  | Project setup: code repository, environments (dev, staging, live), automatic deployment | –                              | M    | Not started |
| 1.2  | Tenant and branch data model; tenant isolation tests                                    | SAAS-01, SAAS-02, NFR-06       | L    | Not started |
| 1.3  | Login with password and OTP; roles and permissions                                      | STF-01, NFR-05                 | M    | Not started |
| 1.4  | Showroom settings: logo, GSTIN, address, invoice prefix, terms                          | STF-05                         | S    | Not started |
| 1.5  | Audit log for invoices, payments, stock and settings                                    | NFR-08                         | M    | Not started |
| 1.6  | Model catalogue: brand, model, variant, colour, price, tax rate                         | INV-01                         | M    | Not started |
| 1.7  | Bike units by chassis number with serials and status                                    | INV-02, INV-03                 | M    | Not started |
| 1.8  | Spare parts and accessories with stock levels and reorder alerts                        | INV-04, INV-05                 | M    | Not started |
| 1.9  | Purchase entries from suppliers                                                         | INV-06                         | M    | Not started |
| 1.10 | Excel/CSV import for models, stock and customers                                        | INV-07                         | M    | Not started |
| 1.11 | Customer records and search by name or phone                                            | SAL-01                         | S    | Not started |
| 1.12 | Quotation and booking with advance payment                                              | SAL-02, SAL-03                 | M    | Not started |
| 1.13 | GST tax invoice with sequential numbering per financial year                            | SAL-04                         | L    | Not started |
| 1.14 | Payments, part-payments, credit notes and returns                                       | SAL-05, SAL-13                 | M    | Not started |
| 1.15 | Invoice PDF and share on WhatsApp                                                       | SAL-06                         | S    | Not started |
| 1.16 | Job card creation with photos and service type                                          | SRV-01                         | M    | Not started |
| 1.17 | Technician assignment and job status flow                                               | SRV-02                         | S    | Not started |
| 1.18 | Parts and labour on job card; automatic stock deduction                                 | SRV-03                         | M    | Not started |
| 1.19 | Service invoice with GST                                                                | SRV-05                         | S    | Not started |
| 1.20 | Service history per bike; search by chassis number or phone                             | SRV-06                         | S    | Not started |
| 1.21 | Free-service schedule and component warranty expiry per bike                            | SRV-07, SRV-10                 | M    | Not started |
| 1.22 | Messaging integration and automatic service-due reminders                               | SRV-08                         | M    | Not started |
| 1.23 | Owner dashboard: sales, collections, open jobs, low stock                               | FIN-01                         | M    | Not started |
| 1.24 | Reports: sales, service revenue, outstanding; export to Excel/PDF                       | FIN-02, FIN-03, FIN-04, FIN-08 | M    | Not started |
| 1.25 | Daily backups and restore test                                                          | NFR-07                         | S    | Not started |
| 1.26 | Load our showroom's data, train staff, run 4-week pilot                                 | –                              | M    | Not started |

## Phase 2: SaaS launch

Phase 2 opens the product to other dealers and ends at Gate 2: 5 pilot dealers paying and renewing. Epics will be broken into tasks once Phase 1 is live.

| Epic                  | Main work                                                                                                                          | Requirement                      |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Signup and onboarding | Self-signup with OTP, onboarding wizard, import templates, master catalogue                                                        | SAAS-03 to SAAS-06               |
| Plans and billing     | Plans with feature flags and limits, free trial, payment gateway subscriptions, upgrade/downgrade, grace period and read-only mode | SAAS-07 to SAAS-11               |
| Super admin panel     | Tenant list, usage, MRR and churn, support access with audit, announcements                                                        | SAAS-12, SAAS-14                 |
| Data export           | Full tenant export to Excel/CSV                                                                                                    | SAAS-15                          |
| CRM                   | Leads, test rides, follow-ups, pipeline, feedback                                                                                  | CRM-01 to CRM-04                 |
| Sales extras          | Delivery checklist, finance/EMI, exchange, RTO, subsidy, extended warranty                                                         | SAL-07 to SAL-12                 |
| Service extras        | Estimate approval, battery health log, OEM warranty claims                                                                         | SRV-04, SRV-09, SRV-11           |
| Inventory extras      | Purchase orders, barcode/QR labels, stock ageing                                                                                   | INV-08, INV-10, INV-11           |
| Finance and staff     | Expenses, GST reports and GSTR-1 export, profit report, targets, technician workload                                               | FIN-05 to FIN-07, STF-02, STF-04 |
| Offline and languages | Offline billing and job cards; Hindi and one regional language                                                                     | NFR-04, NFR-10                   |
| Go-to-market          | Pricing, website, demo video, onboarding 5–10 pilot dealers                                                                        | –                                |

## Phase 3: Scale

Phase 3 adds what larger dealers and multi-branch groups need; the order will follow pilot dealer feedback.

| Epic                  | Main work                                                                | Requirement            |
| --------------------- | ------------------------------------------------------------------------ | ---------------------- |
| Multi-branch          | Stock transfers between branches, branch-level reports                   | INV-09                 |
| Customer portal / app | Own bikes, invoices, service booking, pick-up/drop, QR service history   | CRM-07, SRV-12, SRV-13 |
| Marketing             | Bulk WhatsApp/SMS campaigns, referral rewards                            | CRM-05, CRM-06         |
| Staff incentives      | Commission calculation                                                   | STF-03                 |
| Integrations          | Tally/Zoho export, GST e-invoicing, OEM portals, public API and webhooks | SAAS-16                |
| Add-ons               | Message credit packs, extra branches and users                           | SAAS-13                |
| Connected bikes       | IoT/GPS battery and fault data                                           | –                      |
