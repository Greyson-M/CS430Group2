import { test, expect } from '@playwright/test';
import { API_URL, ensureDistributorMode, loginApi, loginUi, registerUser } from './e2e.helpers';

test('manual scanner rejects malformed JWT input', async ({ page, request }) => {
  const vendor = await registerUser(request, { role: 'vendor' });

  await loginUi(page, vendor);
  await ensureDistributorMode(page);
  await page.getByRole('button', { name: /Launch Scanner/i }).click();

  await page.getByPlaceholder('Paste a signed ticket JWT here...').fill('not-a-real-jwt');

  const dialogHandled = new Promise((resolve) => {
    page.once('dialog', async (dialog) => {
      const message = dialog.message();
      await dialog.accept();
      resolve(message);
    });
  });

  await page.getByRole('button', { name: 'Scan', exact: true }).click();

  const message = await dialogHandled;
  expect(message).toContain('Invalid Ticket Format');
});

test('sync endpoint records invalid signatures as failed audit entries', async ({ request }) => {
  const vendor = await registerUser(request, { role: 'vendor' });
  const login = await loginApi(request, vendor);

  const response = await request.post(`${API_URL}/api/tickets/sync`, {
    headers: {
      Authorization: `Bearer ${login.token}`,
    },
    data: {
      transactions: [
        {
          qr_payload: 'not.a.valid.jwt',
          scanned_at: new Date().toISOString(),
        },
      ],
    },
  });

  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  expect(body.sync_summary.total_submitted).toBe(1);
  expect(body.sync_summary.failed_count).toBe(1);
  expect(body.failed[0].flag).toBe('INVALID_SIGNATURE');
});

test('sync endpoint rejects an empty ledger', async ({ request }) => {
  const vendor = await registerUser(request, { role: 'vendor' });
  const login = await loginApi(request, vendor);

  const response = await request.post(`${API_URL}/api/tickets/sync`, {
    headers: {
      Authorization: `Bearer ${login.token}`,
    },
    data: {
      transactions: [],
    },
  });

  expect(response.status()).toBe(400);

  const body = await response.json();
  expect(body.error).toContain('non-empty list');
});