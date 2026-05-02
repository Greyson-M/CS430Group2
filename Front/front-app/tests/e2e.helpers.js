import { expect } from '@playwright/test';

export const APP_URL = process.env.PW_APP_URL ?? 'http://localhost:5174';
export const API_URL = process.env.PW_API_URL ?? 'http://localhost:5000';

export function uniqueEmail(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.test`;
}

export async function registerUser(request, { role, username = uniqueEmail(role), password = 'pw123456' }) {
  const user_type = role === 'vendor' ? 'vendors' : 'wanters';

  const response = await request.post(`${API_URL}/api/register`, {
    data: { user_type, username, password },
  });

  const body = await response.json();
  expect(response.ok(), JSON.stringify(body)).toBeTruthy();

  return {
    id: body.id,
    username,
    password,
    user_type,
  };
}

export async function loginApi(request, { username, password }) {
  const response = await request.post(`${API_URL}/api/login`, {
    data: { username, password },
  });

  const body = await response.json();
  expect(response.ok(), JSON.stringify(body)).toBeTruthy();
  return body;
}

export async function loginUi(page, { username, password }) {
  await page.goto(APP_URL);
  await page.locator('input[type="email"]').fill(username);
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page.getByRole('button', { name: /Mode:/i })).toBeVisible();
}

export async function clearSession(page) {
  await page.goto(APP_URL);
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
}

export async function ensureRecipientMode(page) {
  const toggle = page.getByRole('button', { name: /Mode:/i });
  if ((await toggle.textContent())?.includes('Holder')) {
    await toggle.click();
  }
  await expect(toggle).toContainText('Recipient');
}

export async function ensureDistributorMode(page) {
  const toggle = page.getByRole('button', { name: /Mode:/i });
  if ((await toggle.textContent())?.includes('Recipient')) {
    await toggle.click();
  }
  await expect(toggle).toContainText('Holder');
}

export async function createResourceUi(page, {
  name,
  provider = 'E2E Pantry',
  location = 'Test Site',
  quantity = '3',
  unit = 'Boxes',
  status = 'Public',
}) {
  await page.getByRole('button', { name: /Register Resource/i }).click();
  await page.locator('input[name="name"]').fill(name);
  await page.locator('input[name="provider"]').fill(provider);
  await page.locator('input[name="location"]').fill(location);
  await page.locator('input[name="quantity"]').fill(quantity);
  await page.locator('input[name="unit"]').fill(unit);
  await page.locator('select[name="status"]').selectOption(status);
  await page.getByRole('button', { name: /Register Resource/i }).click();
}

export async function firstSavedRecipientTicket(page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('recipientTickets');
    const tickets = raw ? JSON.parse(raw) : [];
    return tickets[0] ?? null;
  });
}