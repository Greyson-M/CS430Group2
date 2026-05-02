import { test, expect } from '@playwright/test';
import { APP_URL, loginUi, registerUser } from './e2e.helpers';

test.describe('Authentication UI', () => {
  test('vendor can log in through the real API and gets a real session', async ({ page, request }) => {
    const vendor = await registerUser(request, { role: 'vendor' });

    await loginUi(page, vendor);

    await expect(page.getByRole('button', { name: /Mode:/i })).toContainText('Holder');
    await expect(page.getByText('Supply Distribution Hub')).toBeVisible();
    await expect(page.getByText('Session: Authenticated')).toBeVisible();

    const storage = await page.evaluate(() => ({
      authToken: localStorage.getItem('authToken'),
      userType: localStorage.getItem('userType'),
      userId: localStorage.getItem('userId'),
    }));

    expect(storage.authToken).toBeTruthy();
    expect(storage.userType).toBe('vendors');
    expect(storage.userId).toMatch(/^[a-f0-9]{24}$/);
  });

  test('recipient can log in and keep the session after reload', async ({ page, request }) => {
    const recipient = await registerUser(request, { role: 'recipient' });

    await loginUi(page, recipient);
    await expect(page.getByRole('button', { name: /Mode:/i })).toContainText('Recipient');

    await page.reload();

    await expect(
      page.locator('header').getByText('Rationing Manager', { exact: true })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /Mode:/i })).toContainText('Recipient');
    await expect(page.getByText('Session: Authenticated')).toBeVisible();
  });

  test('authenticated user can switch shells with the mode toggle', async ({ page, request }) => {
    const recipient = await registerUser(request, { role: 'recipient' });

    await loginUi(page, recipient);

    const toggle = page.getByRole('button', { name: /Mode:/i });
    await expect(toggle).toContainText('Recipient');

    await toggle.click();
    await expect(toggle).toContainText('Holder');
    await expect(page.getByText('Supply Distribution Hub')).toBeVisible();

    await toggle.click();
    await expect(toggle).toContainText('Recipient');
    await expect(page.getByRole('button', { name: 'Explore Resources' })).toBeVisible();
  });

  test('invalid credentials show the login failure dialog', async ({ page }) => {
    await page.goto(APP_URL);
    await page.locator('input[type="email"]').fill('nobody@example.com');
    await page.locator('input[type="password"]').first().fill('definitely-wrong');

    const dialogPromise = page.waitForEvent('dialog');
    await page.getByRole('button', { name: 'Sign In' }).click();

    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Login failed');
    await dialog.accept();

    await expect(page.getByText('Welcome Back')).toBeVisible();
  });
});