import { test, expect } from '@playwright/test';
import { API_URL, loginApi, registerUser } from './e2e.helpers';

test.describe('Backend Authorization', () => {
  test('validate-token accepts a real issued token', async ({ request }) => {
    const vendor = await registerUser(request, { role: 'vendor' });
    const login = await loginApi(request, vendor);

    const response = await request.post(`${API_URL}/api/validate-token`, {
      headers: {
        Authorization: `Bearer ${login.token}`,
      },
    });

    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.user_id).toBe(login.user_id);
  });

  test('vendor cannot create an item for another vendor id', async ({ request }) => {
    const owner = await registerUser(request, { role: 'vendor' });
    const attacker = await registerUser(request, { role: 'vendor' });
    const attackerLogin = await loginApi(request, attacker);

    const response = await request.post(`${API_URL}/api/items`, {
      headers: {
        Authorization: `Bearer ${attackerLogin.token}`,
      },
      data: {
        vendor_id: owner.id,
        item_name: 'Unauthorized item',
        fields: {
          status: 'Public',
        },
      },
    });

    expect(response.status()).toBe(403);
  });

  test('vendor cannot delete another vendor item', async ({ request }) => {
    const owner = await registerUser(request, { role: 'vendor' });
    const attacker = await registerUser(request, { role: 'vendor' });

    const ownerLogin = await loginApi(request, owner);
    const attackerLogin = await loginApi(request, attacker);

    const createResponse = await request.post(`${API_URL}/api/items`, {
      headers: {
        Authorization: `Bearer ${ownerLogin.token}`,
      },
      data: {
        vendor_id: owner.id,
        item_name: 'Protected item',
        fields: {
          provider: 'Owner only',
          status: 'Public',
        },
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const created = await createResponse.json();

    const deleteResponse = await request.delete(`${API_URL}/api/items/${created.id}`, {
      headers: {
        Authorization: `Bearer ${attackerLogin.token}`,
      },
    });

    expect(deleteResponse.status()).toBe(403);
  });
});