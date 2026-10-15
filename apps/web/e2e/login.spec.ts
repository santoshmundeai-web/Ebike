import { expect, test, type Page } from '@playwright/test';

/** Demo users from apps/web/scripts/seed.ts. */
const PASSWORD = 'Demo@12345';
const OWNER = 'owner@demo.ebike.local';
const SALES = 'sales@demo.ebike.local';

/** Our alerts (Next.js also renders an empty role="alert" route announcer). */
const alert = (page: Page) => page.locator('[data-slot="alert"]');

async function signInWithPassword(page: Page, email: string, password = PASSWORD) {
  await page.goto('/login');
  await page.getByRole('tab', { name: 'Email & password' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test('TC-1.3-01 owner signs in with email and password and sees the dashboard', async ({
  page,
}) => {
  await signInWithPassword(page, OWNER);
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole('heading', { name: 'Welcome, Demo Owner' })).toBeVisible();
  await expect(page.getByText('Owner', { exact: true })).toBeVisible();
  await expect(page.getByText('All branches')).toBeVisible();
});

test('TC-1.3-02 a wrong password shows a generic error', async ({ page }) => {
  await signInWithPassword(page, OWNER, 'wrong-password');
  await expect(alert(page)).toHaveText('Email or password is incorrect.');
  await expect(page).toHaveURL(/\/login$/);
});

test('TC-1.3-04 phone OTP: asking for a code moves to the code step', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Mobile number').fill('99999 00001');
  await page.getByRole('button', { name: 'Send OTP' }).click();
  await expect(page.getByText('We sent a 6-digit code to +91 ******0001.')).toBeVisible();
  await expect(page.getByLabel('6-digit code')).toBeFocused();
});

test('TC-1.3-04 an invalid mobile number is rejected before sending', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Mobile number').fill('12345');
  await page.getByRole('button', { name: 'Send OTP' }).click();
  await expect(alert(page)).toHaveText('Enter a valid 10-digit Indian mobile number.');
});

test('TC-1.3-06 sign-out returns to the login page and the app stays closed', async ({ page }) => {
  await signInWithPassword(page, OWNER);
  await expect(page).toHaveURL(/\/app$/);
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/app');
  await expect(page).toHaveURL(/\/login$/);
});

test('TC-1.3-08 the owner adds a staff user who appears in the list', async ({ page }) => {
  const phone = `98${String(Date.now()).slice(-8)}`;
  await signInWithPassword(page, OWNER);
  await page.getByRole('link', { name: 'Staff' }).click();
  await expect(page.getByRole('heading', { name: 'Staff', exact: true })).toBeVisible();

  await page.getByLabel('Full name').fill('E2E Technician');
  await page.getByLabel('Mobile number').fill(phone);
  await page.getByLabel('Role').selectOption('technician');
  await page.getByRole('button', { name: 'Add staff' }).click();

  await expect(
    page.getByText('E2E Technician has been added. They can now sign in.'),
  ).toBeVisible();
  const card = page.getByRole('listitem').filter({ hasText: 'E2E Technician' });
  await expect(card.getByText('Technician', { exact: true })).toBeVisible();

  // Clean up so the demo data stays the same for screenshots.
  await card.getByRole('button', { name: 'Remove access' }).click();
  await expect(page.getByRole('listitem').filter({ hasText: 'E2E Technician' })).toHaveCount(0);
});

test('TC-1.3-11 a sales executive has no Staff page, even by direct URL', async ({ page }) => {
  await signInWithPassword(page, SALES);
  await expect(page.getByText('Sales Executive', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Staff' })).toHaveCount(0);
  await page.goto('/app/staff');
  await expect(alert(page)).toHaveText('You do not have access to this page.');
});

test('NFR-10 the login page switches to Hindi', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'हिंदी' }).click();
  await expect(page.getByRole('heading', { name: 'साइन इन करें' })).toBeVisible();
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});
