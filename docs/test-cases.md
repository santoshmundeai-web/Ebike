# Test cases — Phase 1 (MVP)

One section per task in the [task plan](EBike%20Dealer%20Management%20System%20–%20Task%20Plan.md);
status of the tasks themselves is in [task.md](../task.md).

**IDs:** `TC-<task>-<nn>`, e.g. `TC-1.13-09`. Automated tests put the ID at the start of the test name,
so `pnpm test -t "TC-1.13"` runs one task's tests.

**Type:** Unit (`packages/core`, no database) · Integration (real Postgres, as the RLS-restricted app role)
· E2E (Playwright in a browser, 360 px phone viewport unless stated) · Manual.

**Status:** ✅ Automated (passing) · 📝 Todo (written as `it.todo` or not yet written) · 👤 Manual check.

Rules that apply to every task, from [CLAUDE.md](../CLAUDE.md):

- Every new tenant-owned table gets isolation cases like TC-1.2-03 to TC-1.2-07.
- Every bug fix comes with a test that fails before the fix.
- Money is checked in paise (integers); a test that compares floats for money is a bug.

---

## 1.1 Project setup

| ID        | Test case                                                           | Type             | Status                                      |
| --------- | ------------------------------------------------------------------- | ---------------- | ------------------------------------------- |
| TC-1.1-01 | A clean clone installs with `pnpm install` on Node 24 and pnpm 11   | Manual           | 👤                                          |
| TC-1.1-02 | `pnpm lint && pnpm typecheck && pnpm test` pass on `main`           | CI               | ✅ (CI workflow `.github/workflows/ci.yml`) |
| TC-1.1-03 | A pull request with a failing check cannot be merged                | CI               | 📝                                          |
| TC-1.1-04 | `GET /api/v1/health` returns 200 `{status: ok, database: ok}`       | E2E              | 📝 (checked by hand)                        |
| TC-1.1-05 | `GET /api/v1/health` returns 503 when the database is unreachable   | Integration      | 📝                                          |
| TC-1.1-06 | Merge to `main` deploys to staging; live deploy needs an approval   | Manual           | 👤                                          |
| TC-1.1-07 | `.env` is git-ignored and no secrets are in the repository          | CI (secret scan) | 📝                                          |
| TC-1.1-08 | Staging and live databases and file storage are in an Indian region | Manual           | 👤                                          |

## 1.2 Tenant and branch data model (SAAS-01, SAAS-02, NFR-06)

Automated in [packages/db/src/tenant-isolation.test.ts](../packages/db/src/tenant-isolation.test.ts).

| ID        | Test case                                                                                                            | Type              | Status                                                                                                                                                                                             |
| --------- | -------------------------------------------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TC-1.2-01 | The app's database role is not a superuser and cannot bypass RLS                                                     | Integration       | ✅                                                                                                                                                                                                 |
| TC-1.2-02 | With no tenant set, every tenant table returns zero rows                                                             | Integration       | ✅                                                                                                                                                                                                 |
| TC-1.2-03 | Tenant A reads only its own rows in `tenants`, `branches`, `audit_log`                                               | Integration       | ✅                                                                                                                                                                                                 |
| TC-1.2-04 | Tenant A cannot read tenant B's branch by id                                                                         | Integration       | ✅                                                                                                                                                                                                 |
| TC-1.2-05 | Tenant A cannot update or delete tenant B's rows (0 rows affected, B unchanged)                                      | Integration       | ✅                                                                                                                                                                                                 |
| TC-1.2-06 | Tenant A cannot insert a row with tenant B's `tenant_id` (RLS error)                                                 | Integration       | ✅                                                                                                                                                                                                 |
| TC-1.2-07 | Tenant A cannot move its own row to tenant B                                                                         | Integration       | ✅                                                                                                                                                                                                 |
| TC-1.2-08 | The tenant setting does not survive the transaction (pooled connection reuse)                                        | Integration       | ✅                                                                                                                                                                                                 |
| TC-1.2-09 | A tenant id that is not a UUID is rejected before any SQL runs                                                       | Integration       | ✅                                                                                                                                                                                                 |
| TC-1.2-10 | Branch code is unique within a tenant; two tenants may both have `MAIN`                                              | Integration       | ✅                                                                                                                                                                                                 |
| TC-1.2-11 | Every table with a `tenant_id` column has RLS enabled and at least one policy (guard against new tables missing RLS) | Integration       | ✅                                                                                                                                                                                                 |
| TC-1.2-12 | Many concurrent requests for tenants A and B each see only their own data                                            | Integration       | ✅                                                                                                                                                                                                 |
| TC-1.2-13 | A user assigned to branch X sees only branch X's branch-scoped records; the owner sees all branches                  | Integration       | 🟡 scope rules ✅ ([permissions.test.ts](../packages/core/src/permissions.test.ts), [auth.test.ts](../apps/web/src/server/auth/auth.test.ts)); filtering of branch data 📝 as branch tables arrive |
| TC-1.2-14 | A `tenant_id` sent in a request body or query string is ignored; the session's tenant is used                        | Integration (API) | 🟡 by design: `withAuth` takes the tenant from the session; test 📝 with the first write API                                                                                                       |

## 1.3 Login, roles and permissions (STF-01, NFR-05)

| ID        | Test case                                                                                             | Type              | Status                                                                                                                                                                         |
| --------- | ----------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TC-1.3-01 | Login with correct email and password succeeds and lands on the dashboard                             | E2E               | ✅ ([auth.test.ts](../apps/web/src/server/auth/auth.test.ts), [login.spec.ts](../apps/web/e2e/login.spec.ts))                                                                  |
| TC-1.3-02 | Wrong password or unknown user shows the same generic error (no account enumeration)                  | E2E               | ✅ ([auth.test.ts](../apps/web/src/server/auth/auth.test.ts), [login.spec.ts](../apps/web/e2e/login.spec.ts))                                                                  |
| TC-1.3-03 | Passwords are stored hashed; no plaintext password in the database                                    | Integration       | ✅ ([auth.test.ts](../apps/web/src/server/auth/auth.test.ts))                                                                                                                  |
| TC-1.3-04 | OTP login: OTP is sent through the messaging module, works once, expires after the set time           | Integration       | ✅ ([auth.test.ts](../apps/web/src/server/auth/auth.test.ts), [login.spec.ts](../apps/web/e2e/login.spec.ts); live MSG91 check 📝)                                             |
| TC-1.3-05 | OTP abuse limits: resend cooldown and lock after too many wrong attempts                              | Integration       | ✅ ([auth.test.ts](../apps/web/src/server/auth/auth.test.ts))                                                                                                                  |
| TC-1.3-06 | Session ends after the inactivity timeout; logout invalidates the session on the server               | E2E               | ✅ sign-out ([auth.test.ts](../apps/web/src/server/auth/auth.test.ts), [login.spec.ts](../apps/web/e2e/login.spec.ts)); inactivity timeout is Better Auth config               |
| TC-1.3-07 | A user who is not a member of a tenant gets 403 on that tenant's API                                  | Integration (API) | ✅ ([auth.test.ts](../apps/web/src/server/auth/auth.test.ts))                                                                                                                  |
| TC-1.3-08 | Owner adds a staff user, assigns a role and one or more branches                                      | E2E               | ✅ ([auth.test.ts](../apps/web/src/server/auth/auth.test.ts), [login.spec.ts](../apps/web/e2e/login.spec.ts))                                                                  |
| TC-1.3-09 | Sales Executive never receives cost price or margin fields in API responses                           | Integration (API) | 🟡 permission rule ✅ ([permissions.test.ts](../packages/core/src/permissions.test.ts)); response filtering 📝 when cost fields exist (1.6, 1.8)                               |
| TC-1.3-10 | Technician sees only the job cards assigned to them                                                   | Integration (API) | 🟡 permission rule ✅ ([permissions.test.ts](../packages/core/src/permissions.test.ts)); job card filtering 📝 (1.17)                                                          |
| TC-1.3-11 | Permission checks are enforced on the server (direct API call returns 403), not only hidden in the UI | Integration (API) | ✅ ([permissions.test.ts](../packages/core/src/permissions.test.ts), [auth.test.ts](../apps/web/src/server/auth/auth.test.ts), [login.spec.ts](../apps/web/e2e/login.spec.ts)) |
| TC-1.3-12 | A deactivated user cannot log in and their existing sessions are revoked                              | Integration       | ✅ ([auth.test.ts](../apps/web/src/server/auth/auth.test.ts))                                                                                                                  |
| TC-1.3-13 | Phone numbers in OTP logs are masked                                                                  | Unit              | ✅ (logger redaction, [log.test.ts](../packages/shared/src/log.test.ts))                                                                                                       |

## 1.4 Showroom settings (STF-05)

| ID        | Test case                                                                                                                | Type              | Status                                                                                                         |
| --------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------- | -------------------------------------------------------------------------------------------------------------- |
| TC-1.4-01 | Owner saves name, legal name, GSTIN, address, logo, invoice prefix and terms; values persist                             | E2E               | 📝                                                                                                             |
| TC-1.4-02 | GSTIN with a wrong format is rejected                                                                                    | Unit              | ✅ ([schemas.test.ts](../packages/shared/src/schemas.test.ts))                                                 |
| TC-1.4-03 | GSTIN with a wrong check digit is rejected                                                                               | Unit              | 📝                                                                                                             |
| TC-1.4-04 | GSTIN state code must match the branch's state                                                                           | Unit              | 📝                                                                                                             |
| TC-1.4-05 | Invoice prefix allows only letters, digits, `-` and `/`, and keeps the full number within 16 characters                  | Unit              | ✅ ([invoice-number.test.ts](../packages/core/src/invoice-number.test.ts))                                     |
| TC-1.4-06 | Changing the prefix mid-year follows the agreed rule (see open decisions in task.md) and never renumbers issued invoices | Integration       | 📝                                                                                                             |
| TC-1.4-07 | Logo upload accepts PNG/JPG/WebP up to 1 MB; it is stored in object storage and shown on the invoice PDF                 | Integration       | 📝                                                                                                             |
| TC-1.4-08 | Roles other than Owner get 403 when changing settings                                                                    | Integration (API) | 🟡 permission rule ✅ ([permissions.test.ts](../packages/core/src/permissions.test.ts)); settings API 📝 (1.4) |
| TC-1.4-09 | A settings change writes an audit entry with before and after values                                                     | Integration       | 📝                                                                                                             |

## 1.5 Audit log (NFR-08)

| ID        | Test case                                                                                                                                                 | Type        | Status |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------ |
| TC-1.5-01 | `writeAudit` stores actor, action, entity type and id, before, after and time                                                                             | Integration | ✅     |
| TC-1.5-02 | The app role cannot update or delete audit rows                                                                                                           | Integration | ✅     |
| TC-1.5-03 | Audit rows are visible only to their own tenant                                                                                                           | Integration | ✅     |
| TC-1.5-04 | If the change is rolled back, its audit entry is rolled back too                                                                                          | Integration | ✅     |
| TC-1.5-05 | Invoice create and cancel, payment create, edit and delete, every stock movement, settings change and user role change each write exactly one audit entry | Integration | 📝     |
| TC-1.5-06 | Entries written by background jobs have no user and name the job                                                                                          | Integration | 📝     |
| TC-1.5-07 | Owner can see the change history of an invoice                                                                                                            | E2E         | 📝     |

## 1.6 Model catalogue (INV-01)

| ID        | Test case                                                                                           | Type        | Status                                                   |
| --------- | --------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------- |
| TC-1.6-01 | Create brand → model → variant → colour with price, battery type, range, HSN and GST rate           | E2E         | 📝                                                       |
| TC-1.6-02 | Price typed as "69,999.50" is stored as 6999950 paise                                               | Unit        | ✅ ([money.test.ts](../packages/core/src/money.test.ts)) |
| TC-1.6-03 | Only supported GST rates are accepted                                                               | Unit        | ✅ ([gst.test.ts](../packages/core/src/gst.test.ts))     |
| TC-1.6-04 | A model is flagged low-speed (no RTO) or high-speed (RTO needed)                                    | Integration | 📝                                                       |
| TC-1.6-05 | Duplicate model name under the same brand is rejected within a tenant but allowed in another tenant | Integration | 📝                                                       |
| TC-1.6-06 | A discontinued (soft-deleted) model is hidden from new quotations but still shows on old invoices   | Integration | 📝                                                       |
| TC-1.6-07 | Changing a catalogue price does not change existing quotations or invoices                          | Integration | 📝                                                       |
| TC-1.6-08 | Catalogue tables pass the tenant isolation cases                                                    | Integration | 📝                                                       |

## 1.7 Bike units by chassis number (INV-02, INV-03)

| ID        | Test case                                                                                                             | Type               | Status                                                         |
| --------- | --------------------------------------------------------------------------------------------------------------------- | ------------------ | -------------------------------------------------------------- |
| TC-1.7-01 | Add a unit with chassis number and motor, battery, controller and charger serials                                     | E2E                | 📝                                                             |
| TC-1.7-02 | Chassis number is unique within a tenant; the same chassis may exist in another tenant                                | Integration        | 📝                                                             |
| TC-1.7-03 | Chassis number is trimmed and upper-cased; I, O, Q and symbols are rejected                                           | Unit               | ✅ ([schemas.test.ts](../packages/shared/src/schemas.test.ts)) |
| TC-1.7-04 | Each component serial is unique per tenant and component type                                                         | Integration        | 📝                                                             |
| TC-1.7-05 | Allowed status changes: in transit → in stock → booked → sold; booked → in stock (booking cancelled); in stock ↔ demo | Unit               | 📝 (`it.todo`)                                                 |
| TC-1.7-06 | Rejected status changes, e.g. in transit → sold, sold → in stock without a return                                     | Unit               | 📝 (`it.todo`)                                                 |
| TC-1.7-07 | Every status change goes through one service function and writes an audit entry                                       | Integration        | 📝                                                             |
| TC-1.7-08 | A unit becomes sold only through an invoice, never by editing it                                                      | Integration        | 📝                                                             |
| TC-1.7-09 | Search by full chassis number or its last 6 characters returns in under 1 second with 50,000 units                    | Integration (perf) | 📝                                                             |

## 1.8 Spare parts and accessories (INV-04, INV-05)

| ID        | Test case                                                                                          | Type              | Status |
| --------- | -------------------------------------------------------------------------------------------------- | ----------------- | ------ |
| TC-1.8-01 | Create a part with SKU, HSN, GST rate, cost price, selling price and reorder level                 | E2E               | 📝     |
| TC-1.8-02 | Quantity on hand equals the sum of stock movements; there is no way to set quantity directly       | Integration       | 📝     |
| TC-1.8-03 | Purchase, sale, job card and adjustment each create a movement that references its source document | Integration       | 📝     |
| TC-1.8-04 | A manual adjustment needs a reason and writes an audit entry                                       | Integration       | 📝     |
| TC-1.8-05 | Short stock follows the agreed rule (block or allow negative — see open decisions)                 | Integration       | 📝     |
| TC-1.8-06 | Low-stock alert appears when quantity ≤ reorder level and clears after restocking                  | Integration       | 📝     |
| TC-1.8-07 | Cost price is hidden from Sales Executive                                                          | Integration (API) | 📝     |
| TC-1.8-08 | Two simultaneous deductions of the last unit cannot both succeed                                   | Integration       | 📝     |

## 1.9 Purchase entries (INV-06)

| ID        | Test case                                                                                                    | Type        | Status                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------ | ----------- | -------------------------------------------------------------------- |
| TC-1.9-01 | Record a supplier invoice: supplier, invoice number, date, bike lines with chassis, part lines with quantity | E2E         | 📝                                                                   |
| TC-1.9-02 | Saving creates bike units (in stock or in transit) and part stock movements                                  | Integration | 📝                                                                   |
| TC-1.9-03 | The same supplier invoice number for the same supplier cannot be entered twice                               | Integration | 📝                                                                   |
| TC-1.9-04 | Input tax is split CGST+SGST or IGST by the supplier's state                                                 | Unit        | ✅ (same GST rules, [gst.test.ts](../packages/core/src/gst.test.ts)) |
| TC-1.9-05 | Cancelling a purchase reverses its stock movements; blocked if any unit from it is already sold              | Integration | 📝                                                                   |
| TC-1.9-06 | Purchase create, edit and cancel write audit entries                                                         | Integration | 📝                                                                   |

## 1.10 Excel/CSV import (INV-07)

| ID         | Test case                                                                              | Type        | Status                                                                                                              |
| ---------- | -------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| TC-1.10-01 | Templates for models, stock and customers can be downloaded                            | E2E         | 📝                                                                                                                  |
| TC-1.10-02 | A valid file shows a preview, then imports every row                                   | Integration | 📝                                                                                                                  |
| TC-1.10-03 | Errors list row number, column and reason; behaviour on errors follows the agreed rule | Integration | 📝                                                                                                                  |
| TC-1.10-04 | Duplicate chassis numbers, within the file or against existing stock, are reported     | Integration | 📝                                                                                                                  |
| TC-1.10-05 | Phone numbers are normalised and amounts like "1,23,456.78" are parsed exactly         | Unit        | ✅ ([money.test.ts](../packages/core/src/money.test.ts), [schemas.test.ts](../packages/shared/src/schemas.test.ts)) |
| TC-1.10-06 | A 5,000-row file is processed by a background job, not inside the web request          | Integration | 📝                                                                                                                  |
| TC-1.10-07 | Hindi and other non-English text is kept intact (UTF-8)                                | Integration | 📝                                                                                                                  |
| TC-1.10-08 | Any tenant column in the file is ignored; rows go to the importing tenant              | Integration | 📝                                                                                                                  |

## 1.11 Customers (SAL-01)

| ID         | Test case                                                                                                  | Type               | Status                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------- |
| TC-1.11-01 | Create a customer with name, phone, address, ID proof and source                                           | E2E                | 📝                                                                                     |
| TC-1.11-02 | Phone is stored as +91XXXXXXXXXX; invalid numbers are rejected                                             | Unit               | ✅ ([schemas.test.ts](../packages/shared/src/schemas.test.ts))                         |
| TC-1.11-03 | A second customer with the same phone follows the agreed rule (warn or block)                              | Integration        | 📝                                                                                     |
| TC-1.11-04 | Search by part of the name or the last digits of the phone returns in under 1 second with 50,000 customers | Integration (perf) | 📝                                                                                     |
| TC-1.11-05 | ID proof numbers are masked in lists and never appear in logs                                              | Unit + Integration | 🟡 log masking ✅ ([log.test.ts](../packages/shared/src/log.test.ts)); list masking 📝 |
| TC-1.11-06 | Customers of another tenant never appear in search                                                         | Integration        | 📝                                                                                     |
| TC-1.11-07 | A DPDP deletion request removes personal fields but keeps the invoices required by law                     | Integration        | 📝                                                                                     |

## 1.12 Quotation and booking (SAL-02, SAL-03)

| ID         | Test case                                                                                   | Type        | Status |
| ---------- | ------------------------------------------------------------------------------------------- | ----------- | ------ |
| TC-1.12-01 | Quotation with variant, colour, price, accessories and discount shows correct GST and total | E2E         | 📝     |
| TC-1.12-02 | A discount above the owner's limit needs manager approval before the quotation is saved     | Integration | 📝     |
| TC-1.12-03 | Converting to a booking records the advance payment and expected delivery date              | E2E         | 📝     |
| TC-1.12-04 | Booking a specific unit sets it to booked; it cannot be booked twice                        | Integration | 📝     |
| TC-1.12-05 | Cancelling a booking returns the unit to in stock and records the advance refund            | Integration | 📝     |
| TC-1.12-06 | Quotation prices do not change when catalogue prices change                                 | Integration | 📝     |

## 1.13 GST tax invoice (SAL-04)

Domain rules automated in [packages/core](../packages/core/src/).

| ID         | Test case                                                                                                  | Type        | Status         |
| ---------- | ---------------------------------------------------------------------------------------------------------- | ----------- | -------------- |
| TC-1.13-01 | Intra-state: CGST and SGST are each half the rate, rounded per line                                        | Unit        | ✅             |
| TC-1.13-02 | Inter-state: IGST only                                                                                     | Unit        | ✅             |
| TC-1.13-03 | Tax is rounded per line, then totalled, then rounded to the rupee with an explicit round-off               | Unit        | ✅             |
| TC-1.13-04 | One invoice with lines at different GST rates                                                              | Unit        | ✅             |
| TC-1.13-05 | Taxable value back-calculated from a GST-inclusive price (needs CA confirmation)                           | Unit        | ✅             |
| TC-1.13-06 | Supply type comes from the branch state and the place of supply                                            | Unit        | ✅             |
| TC-1.13-07 | The financial year changes at midnight India time on 1 April                                               | Unit        | ✅             |
| TC-1.13-08 | Invoice number format; longer than 16 characters is rejected                                               | Unit        | ✅             |
| TC-1.13-09 | Numbers are sequential with no gaps per tenant + branch + series + financial year                          | Integration | 📝 (`it.todo`) |
| TC-1.13-10 | 20 invoices created at the same moment get 20 unique, consecutive numbers                                  | Integration | 📝 (`it.todo`) |
| TC-1.13-11 | An invoice that fails and rolls back does not use up a number                                              | Integration | 📝 (`it.todo`) |
| TC-1.13-12 | Numbering restarts at 1 in a new financial year                                                            | Integration | 📝 (`it.todo`) |
| TC-1.13-13 | Each branch has its own sequence                                                                           | Integration | 📝 (`it.todo`) |
| TC-1.13-14 | An issued invoice cannot be edited or deleted (API returns 409; the database also refuses)                 | Integration | 📝 (`it.todo`) |
| TC-1.13-15 | The invoice shows GSTIN, HSN per line, place of supply and the chassis, motor, battery and charger serials | E2E         | 📝             |
| TC-1.13-16 | Tax rate and HSN are copied onto the line; later catalogue changes do not affect it                        | Integration | 📝             |
| TC-1.13-17 | Invoicing a bike marks the unit sold and writes an audit entry                                             | Integration | 📝             |
| TC-1.13-18 | Invoice date is the India date (an invoice at 00:30 IST on 1 April belongs to the new year)                | Unit        | ✅             |

## 1.14 Payments, credit notes and returns (SAL-05, SAL-13)

| ID         | Test case                                                                                                | Type              | Status                                                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------- |
| TC-1.14-01 | Record payments by cash, UPI, card, bank transfer and finance                                            | E2E               | 📝                                                                                                              |
| TC-1.14-02 | Balance due = invoice total − payments − credit notes; status unpaid, part-paid or paid                  | Unit              | 📝 (`it.todo`)                                                                                                  |
| TC-1.14-03 | A payment larger than the balance due is rejected                                                        | Unit              | 📝 (`it.todo`)                                                                                                  |
| TC-1.14-04 | A booking advance is applied against the final invoice                                                   | Integration       | 📝                                                                                                              |
| TC-1.14-05 | A credit note references the original invoice, has its own gap-free series and reverses GST line by line | Integration       | 📝                                                                                                              |
| TC-1.14-06 | Credit notes cannot exceed the invoice's value not already credited                                      | Unit              | 📝 (`it.todo`)                                                                                                  |
| TC-1.14-07 | A sales return puts the bike back in stock or parts back via a stock movement                            | Integration       | 📝                                                                                                              |
| TC-1.14-08 | Only Owner and Accountant can edit or delete a payment, and it is audited                                | Integration (API) | 🟡 permission rule ✅ ([permissions.test.ts](../packages/core/src/permissions.test.ts)); payments API 📝 (1.14) |

## 1.15 Invoice PDF and WhatsApp (SAL-06)

| ID         | Test case                                                                                                   | Type        | Status                                                                         |
| ---------- | ----------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------ |
| TC-1.15-01 | The worker renders the PDF with logo and every mandatory GST field                                          | Integration | 📝                                                                             |
| TC-1.15-02 | Amounts use Indian grouping (₹1,23,456.78) and the total appears in words                                   | Unit        | 🟡 grouping ✅ ([money.test.ts](../packages/core/src/money.test.ts)); words 📝 |
| TC-1.15-03 | Customer names in Hindi render correctly in the PDF                                                         | Integration | 📝                                                                             |
| TC-1.15-04 | "Share on WhatsApp" adds a job to the queue and returns at once; the message is not sent inside the request | Integration | 📝                                                                             |
| TC-1.15-05 | Each message is recorded with template, status and cost for the tenant                                      | Integration | 📝                                                                             |
| TC-1.15-06 | Customers who opted out are not messaged                                                                    | Integration | 📝                                                                             |
| TC-1.15-07 | Failed sends are retried with back-off and the final status is visible                                      | Integration | 📝                                                                             |
| TC-1.15-08 | The PDF link shared with customers expires                                                                  | Integration | 📝                                                                             |

## 1.16 Job card (SRV-01)

| ID         | Test case                                                                                                 | Type        | Status |
| ---------- | --------------------------------------------------------------------------------------------------------- | ----------- | ------ |
| TC-1.16-01 | Create a job card: find the bike by chassis or phone, enter odometer, complaints, photos and service type | E2E         | 📝     |
| TC-1.16-02 | Odometer lower than the last recorded reading shows a warning                                             | Integration | 📝     |
| TC-1.16-03 | Photos are compressed on the phone and stored in object storage                                           | E2E         | 📝     |
| TC-1.16-04 | Service type "free" is allowed only when the bike has a free service due                                  | Integration | 📝     |
| TC-1.16-05 | Job card numbers are sequential per branch                                                                | Integration | 📝     |
| TC-1.16-06 | The whole job card flow can be completed one-handed at 360 px width                                       | E2E         | 📝     |

## 1.17 Technician assignment and job status (SRV-02)

| ID         | Test case                                                                       | Type        | Status         |
| ---------- | ------------------------------------------------------------------------------- | ----------- | -------------- |
| TC-1.17-01 | Assign a technician from the job's branch                                       | E2E         | 📝             |
| TC-1.17-02 | Allowed status flow: open → in progress ⇄ waiting for parts → ready → delivered | Unit        | 📝 (`it.todo`) |
| TC-1.17-03 | Skipping or reversing steps is rejected (e.g. open → delivered)                 | Unit        | 📝 (`it.todo`) |
| TC-1.17-04 | Moving to "ready" queues a "bike ready" WhatsApp message                        | Integration | 📝             |
| TC-1.17-05 | Each status change is timestamped (needed later for technician workload)        | Integration | 📝             |

## 1.18 Parts and labour on the job card (SRV-03)

| ID         | Test case                                                             | Type        | Status |
| ---------- | --------------------------------------------------------------------- | ----------- | ------ |
| TC-1.18-01 | Adding a part reduces stock through a movement linked to the job card | Integration | 📝     |
| TC-1.18-02 | Removing the part puts the stock back                                 | Integration | 📝     |
| TC-1.18-03 | Short stock follows the same rule as TC-1.8-05                        | Integration | 📝     |
| TC-1.18-04 | Labour lines carry a SAC code and GST rate                            | Integration | 📝     |
| TC-1.18-05 | Free or warranty jobs charge the customer zero for the covered lines  | Unit        | 📝     |

## 1.19 Service invoice (SRV-05)

| ID         | Test case                                                                   | Type        | Status              |
| ---------- | --------------------------------------------------------------------------- | ----------- | ------------------- |
| TC-1.19-01 | Parts and labour lines each get GST at their own rate                       | Unit        | ✅ (same GST rules) |
| TC-1.19-02 | Service invoices use their own gap-free series                              | Integration | 📝                  |
| TC-1.19-03 | A job can be invoiced only when ready; after invoicing its lines are locked | Integration | 📝                  |
| TC-1.19-04 | Delivery needs the invoice paid, or marked as on credit by an allowed role  | Integration | 📝                  |

## 1.20 Service history (SRV-06)

| ID         | Test case                                                            | Type               | Status |
| ---------- | -------------------------------------------------------------------- | ------------------ | ------ |
| TC-1.20-01 | Search by chassis number shows every job for that bike, newest first | E2E                | 📝     |
| TC-1.20-02 | Search by phone shows every bike of that customer and their jobs     | E2E                | 📝     |
| TC-1.20-03 | Search returns in under 1 second with 50,000 job cards               | Integration (perf) | 📝     |

## 1.21 Free-service schedule and component warranty (SRV-07, SRV-10)

| ID         | Test case                                                                                    | Type        | Status         |
| ---------- | -------------------------------------------------------------------------------------------- | ----------- | -------------- |
| TC-1.21-01 | The dealer sets free services per model as km and months                                     | E2E         | 📝             |
| TC-1.21-02 | A service is due at whichever comes first, km or months from the sale date                   | Unit        | 📝 (`it.todo`) |
| TC-1.21-03 | After a free service is done, the next one becomes due                                       | Unit        | 📝 (`it.todo`) |
| TC-1.21-04 | Free services past their window are marked missed, not due                                   | Unit        | 📝 (`it.todo`) |
| TC-1.21-05 | Warranty end = start + warranty months per component, calculated on India dates              | Unit        | 📝 (`it.todo`) |
| TC-1.21-06 | A warranty is valid on its last day and expired the day after                                | Unit        | 📝 (`it.todo`) |
| TC-1.21-07 | Month-end start dates are handled (31 Jan + 1 month = 28/29 Feb)                             | Unit        | 📝 (`it.todo`) |
| TC-1.21-08 | A component replaced under warranty gets its new serial and follows the agreed warranty rule | Integration | 📝             |
| TC-1.21-09 | List of warranties expiring in the next 30 days                                              | Integration | 📝             |

## 1.22 Messaging and service reminders (SRV-08)

| ID         | Test case                                                                           | Type        | Status               |
| ---------- | ----------------------------------------------------------------------------------- | ----------- | -------------------- |
| TC-1.22-01 | A daily job at a fixed India time finds services due in N days and queues reminders | Integration | 📝                   |
| TC-1.22-02 | The same due service is never reminded twice                                        | Integration | 📝                   |
| TC-1.22-03 | Opted-out customers are skipped                                                     | Integration | 📝                   |
| TC-1.22-04 | Every send is recorded with template, status, cost and tenant                       | Integration | 📝                   |
| TC-1.22-05 | SMS uses DLT-registered template ids                                                | Integration | 📝                   |
| TC-1.22-06 | Temporary provider failures are retried; permanent failures are marked failed       | Integration | 📝                   |
| TC-1.22-07 | Nothing is sent outside the agreed hours                                            | Unit        | 📝                   |
| TC-1.22-08 | The scheduled heartbeat job runs in the worker (queue wiring works)                 | Manual      | 👤 (checked by hand) |

## 1.23 Owner dashboard (FIN-01)

| ID         | Test case                                                            | Type              | Status |
| ---------- | -------------------------------------------------------------------- | ----------------- | ------ |
| TC-1.23-01 | Today's sales count and value use the India date                     | Integration       | 📝     |
| TC-1.23-02 | Today's collections by payment mode match the payments recorded      | Integration       | 📝     |
| TC-1.23-03 | Open jobs by status match the job cards                              | Integration       | 📝     |
| TC-1.23-04 | Low-stock count and list match TC-1.8-06                             | Integration       | 📝     |
| TC-1.23-05 | Dashboard loads in under 2 seconds on a throttled 4G profile         | E2E (perf)        | 📝     |
| TC-1.23-06 | Branch Manager sees only their branches; Owner can see all or filter | Integration (API) | 📝     |

## 1.24 Reports and export (FIN-02, FIN-03, FIN-04, FIN-08)

| ID         | Test case                                                                               | Type              | Status |
| ---------- | --------------------------------------------------------------------------------------- | ----------------- | ------ |
| TC-1.24-01 | Sales report by date, model, salesperson and branch; totals equal the invoices in range | Integration       | 📝     |
| TC-1.24-02 | Service revenue report by date, technician and service type                             | Integration       | 📝     |
| TC-1.24-03 | Outstanding report shows balance and age, and matches TC-1.14-02                        | Integration       | 📝     |
| TC-1.24-04 | Excel and PDF exports match the on-screen totals; Excel amounts are numbers, not text   | Integration       | 📝     |
| TC-1.24-05 | Large exports run as background jobs                                                    | Integration       | 📝     |
| TC-1.24-06 | Cost and profit columns are hidden from sales roles                                     | Integration (API) | 📝     |

## 1.25 Backups and restore (NFR-07)

| ID         | Test case                                                                   | Type               | Status |
| ---------- | --------------------------------------------------------------------------- | ------------------ | ------ |
| TC-1.25-01 | A daily automatic backup exists and is kept for 30 days                     | Manual             | 👤     |
| TC-1.25-02 | Restore to a fresh instance; row counts and invoice totals match the source | Manual (quarterly) | 👤     |
| TC-1.25-03 | Backups are encrypted and stored in India                                   | Manual             | 👤     |

## 1.26 Data load and pilot (Gate 1)

| ID         | Test case                                                                      | Type   | Status |
| ---------- | ------------------------------------------------------------------------------ | ------ | ------ |
| TC-1.26-01 | Loaded counts of models, bikes, parts and customers match the source registers | Manual | 👤     |
| TC-1.26-02 | The critical end-to-end flows pass on staging before go-live (see below)       | E2E    | 📝     |
| TC-1.26-03 | A new salesperson creates an invoice after a 15-minute walkthrough (NFR-12)    | Manual | 👤     |
| TC-1.26-04 | Four weeks of daily use with no paper backup (Gate 1)                          | Manual | 👤     |

### Critical end-to-end flows (CLAUDE.md section 7)

| ID     | Flow                                                    | Status |
| ------ | ------------------------------------------------------- | ------ |
| E2E-01 | Login → create customer → quotation → invoice → payment | 📝     |
| E2E-02 | Job card → add parts → service invoice                  | 📝     |
| E2E-03 | Bike sold → service reminder scheduled                  | 📝     |
