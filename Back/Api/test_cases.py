import json
import requests as _requests

class _Response:
    """Wraps a requests.Response so it matches Flask test client response interface."""
    def __init__(self, r):
        self._r = r
        self.status_code = r.status_code

    def get_json(self):
        try:
            return self._r.json()
        except Exception:
            return None


class RealHttpClient:
    """
    Drop-in replacement for Flask's test client that talks to a real running server.

    Usage:
        client = RealHttpClient("http://127.0.0.1:5000")
        tester = Tester(client)
    """
    def __init__(self, base_url="http://127.0.0.1:5000"):
        self.base_url = base_url.rstrip("/")

    def _url(self, endpoint):
        return self.base_url + endpoint

    def get(self, endpoint, headers=None):
        return _Response(_requests.get(self._url(endpoint), headers=headers))

    def post(self, endpoint, json=None, headers=None):
        return _Response(_requests.post(self._url(endpoint), json=json, headers=headers))

    def put(self, endpoint, json=None, headers=None):
        return _Response(_requests.put(self._url(endpoint), json=json, headers=headers))

    def delete(self, endpoint, headers=None):
        return _Response(_requests.delete(self._url(endpoint), headers=headers))


class Tester:
    def __init__(self, client):
        self.client = client
        self.data = {}
        self.report_card = {}
        self.current_token = None
        self.current_user_id = None
        self.current_item_id = None

    # --- HELPER FUNCTIONS ---
    def _get_headers(self, requires_auth):
        headers = {}
        if requires_auth and self.current_token:
            headers['Authorization'] = f"Bearer {self.current_token}"

        return headers

    def _get(self, endpoint, requires_auth=False):
        return self.client.get(endpoint, headers=self._get_headers(requires_auth))

    def _post(self, endpoint, payload=None, requires_auth=False):
        return self.client.post(endpoint, json=payload, headers=self._get_headers(requires_auth))

    def _put(self, endpoint, payload=None, requires_auth=False):
        return self.client.put(endpoint, json=payload, headers=self._get_headers(requires_auth))

    def _delete(self, endpoint, requires_auth=False):
        return self.client.delete(endpoint, headers=self._get_headers(requires_auth))

    def test_utilities(self):
        result = self._get('/api/time')
        if result.status_code == 200:
            self.report_card["test_utilities"] = "Passed"
        else:
            self.report_card["test_utilities"] = "Failed"

    def test_user_registration_and_login(self):
        test_user = {
            "user_type": "vendors",
            "username": "vendor_test_123",
            "password": "securepassword"
        }
        
        # Registration
        register_result = self._post('/api/register', test_user)
        self.data['register_result'] = register_result
        
        if register_result.status_code == 201:
            self.current_user_id = register_result.get_json().get('id')
            self.report_card["test_user_registration"] = "Passed"
        else:
            self.report_card["test_user_registration"] = "Failed"

        # Login
        login_result = self._post('/api/login', {
            "username": "vendor_test_123",
            "password": "securepassword"
        })
        
        if login_result.status_code == 200:
            self.current_token = login_result.get_json().get("token")
            self.current_user_id = login_result.get_json().get("user_id")

            self.report_card["test_user_login"] = "Passed"
        else:
            self.report_card["test_user_login"] = "Failed"

    def test_item_insertion_invalid(self):
        test_item = {
            "vendor_id": "60a7e0b5f1b2c3d4e5f6a7b8", 
            "item_name": "Invalid Item", 
            "fields": {"color": "red"}
        }
        result = self._post('/api/items', test_item, requires_auth=True)

        if result.status_code == 201:
            self.report_card["test_item_insertion_invalid"] = "Failed"
        else:
            self.report_card["test_item_insertion_invalid"] = "Passed"

    def test_item_insertion(self):
        if not self.current_user_id:
            self.report_card["test_item_insertion_valid_vendor"] = "Skipped"
            return

        test_item_valid = {
            "vendor_id": self.current_user_id, 
            "item_name": "Valid Test Item", 
            "fields": {"color": "blue"}
        }
        
        result = self._post('/api/items', test_item_valid, requires_auth=True)
        
        if result.status_code == 201:
            self.current_item_id = result.get_json().get('id')
            self.report_card["test_item_insertion_valid_vendor"] = "Passed"
        else:
            self.report_card["test_item_insertion_valid_vendor"] = "Failed"

    def test_get_items(self):
        result = self._get('/api/items')
        if result.status_code == 200 and isinstance(result.get_json(), list):
            self.report_card["test_get_items"] = "Passed"
        else:
            self.report_card["test_get_items"] = "Failed"

    def test_update_item(self):
        if not self.current_item_id:
            self.report_card["test_update_item"] = "Skipped"
            return

        update_payload = {"item_name": "Updated Valid Test Item"}
        result = self._put(f'/api/items/{self.current_item_id}', update_payload, requires_auth=True)
        
        if result.status_code == 200:
            self.report_card["test_update_item"] = "Passed"
        else:
            self.report_card["test_update_item"] = "Failed"

    def test_delete_item(self):
        if not self.current_item_id:
            self.report_card["test_delete_item"] = "Skipped"
            return

        result = self._delete(f'/api/items/{self.current_item_id}', requires_auth=True)
        if result.status_code == 200:
            self.report_card["test_delete_item"] = "Passed"
        else:
            self.report_card["test_delete_item"] = "Failed"

    def test_update_user(self):
        if not self.current_user_id:
            self.report_card["test_update_user"] = "Skipped"
            return

        update_payload = {"username": "vendor_test_123_updated"}
        result = self._put(f'/api/user/{self.current_user_id}', update_payload, requires_auth=True)
        print ("Update user result:", result.status_code, result.get_json())
        if result.status_code == 200:
            self.report_card["test_update_user"] = "Passed"
        else:
            self.report_card["test_update_user"] = "Failed"

    def test_get_user(self):
        if not self.current_user_id:
            self.report_card["test_get_user"] = "Skipped"
            return

        result = self._get(f'/api/user/{self.current_user_id}', requires_auth=True)
        if result.status_code == 200:
            self.report_card["test_get_user"] = "Passed"
        else:
            self.report_card["test_get_user"] = "Failed"

    def test_delete_user(self):
        if not self.current_user_id:
            self.report_card["test_delete_user"] = "Skipped"
            return

        result = self._delete(f'/api/user/{self.current_user_id}', requires_auth=True)
        if result.status_code == 200:
            self.report_card["test_delete_user"] = "Passed"
        else:
            self.report_card["test_delete_user"] = "Failed"


    # ---------- Ticketing Workflow Tests ----------

    def test_create_ticket_item(self):
        if not self.current_user_id:
            self.report_card['test_create_ticket_item'] = 'Skipped'
            return

        payload = {
            'vendor_id': self.current_user_id,
            'item_name': 'Ticket Test Item',
            'fields': {'category': 'testing'}
        }
        result = self._post('/api/items', payload, requires_auth=True)
        if result.status_code == 201:
            self.data['ticket_item_id'] = result.get_json().get('id')
            self.report_card['test_create_ticket_item'] = 'Passed'
        else:
            self.report_card['test_create_ticket_item'] = 'Failed'

    def test_generate_ticket_batch(self):
        item_id = self.data.get('ticket_item_id')
        if not item_id:
            self.report_card['test_generate_ticket_batch'] = 'Skipped'
            return

        payload = {'item_id': item_id, 'quantity': 10}
        result = self._post('/api/tickets', payload, requires_auth=True)
        if result.status_code == 201:
            self.data['ticket_batch_id'] = result.get_json().get('ticket_batch_id')
            self.report_card['test_generate_ticket_batch'] = 'Passed'
        else:
            self.report_card['test_generate_ticket_batch'] = 'Failed'

    def test_request_tickets(self):
        batch_id = self.data.get('ticket_batch_id')
        if not batch_id:
            self.report_card['test_request_tickets'] = 'Skipped'
            return

        self.data['qr_payloads'] = []
        all_ok = True
        for _ in range(4):
            result = self._post(f'/api/tickets/{batch_id}/request', requires_auth=True)
            if result.status_code == 200:
                qr = result.get_json().get('qr_payload')
                self.data['qr_payloads'].append(qr)
            else:
                all_ok = False

        if all_ok and len(self.data['qr_payloads']) == 4:
            self.report_card['test_request_tickets'] = 'Passed'
        else:
            self.report_card['test_request_tickets'] = 'Failed'

    def test_sync_clean(self):
        qr_payloads = self.data.get('qr_payloads', [])
        if len(qr_payloads) < 4:
            self.report_card['test_sync_clean'] = 'Skipped'
            return

        transactions = [
            {'qr_payload': qr_payloads[0], 'scanned_at': '2026-04-14T10:00:00Z'},
            {'qr_payload': qr_payloads[1], 'scanned_at': '2026-04-14T10:01:00Z'},
        ]
        result = self._post('/api/tickets/sync', {'transactions': transactions}, requires_auth=True)
        body = result.get_json()
        summary = body.get('sync_summary', {})

        if (result.status_code == 200
                and summary.get('successfully_redeemed') == 2
                and summary.get('flagged_count') == 0
                and summary.get('failed_count') == 0):
            self.report_card['test_sync_clean'] = 'Passed'
        else:
            self.report_card['test_sync_clean'] = 'Failed'

    def test_sync_fraud(self):
        qr_payloads = self.data.get('qr_payloads', [])
        if len(qr_payloads) < 4:
            self.report_card['test_sync_fraud'] = 'Skipped'
            return

        tampered_jwt = (
            'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.'
            'eyJ0aWNrZXRfaWQiOiIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAiLCJpdGVtX2lkIjoiYWJjIiwiZXhwIjo5OTk5OTk5OTk5fQ.'
            'TAMPERED_INVALID_SIG'
        )

        # idx 0: qr[2] valid, first redemption            -> Redeemed (success)
        # idx 1: qr[0] already redeemed in clean test      -> ALREADY_REDEEMED (flagged)
        # idx 2: qr[3] valid, first redemption             -> Redeemed (success)
        # idx 3: qr[3] again, duplicate in this batch      -> DUPLICATE_IN_BATCH (flagged)
        # idx 4: tampered JWT, bad signature               -> INVALID_SIGNATURE (failed)
        # Expected summary: 2 redeemed, 2 flagged, 1 failed
        transactions = [
            {'qr_payload': qr_payloads[2], 'scanned_at': '2026-04-14T11:00:00Z'},
            {'qr_payload': qr_payloads[0], 'scanned_at': '2026-04-14T11:01:00Z'},
            {'qr_payload': qr_payloads[3], 'scanned_at': '2026-04-14T11:02:00Z'},
            {'qr_payload': qr_payloads[3], 'scanned_at': '2026-04-14T11:03:00Z'},
            {'qr_payload': tampered_jwt,   'scanned_at': '2026-04-14T11:04:00Z'},
        ]
        result = self._post('/api/tickets/sync', {'transactions': transactions}, requires_auth=True)
        body = result.get_json()
        summary = body.get('sync_summary', {})

        passed = (result.status_code == 200
                  and summary.get('successfully_redeemed') == 2
                  and summary.get('flagged_count') == 2
                  and summary.get('failed_count') == 1)

        flagged = body.get('flagged', [])
        failed = body.get('failed', [])
        if passed and len(flagged) == 2 and len(failed) == 1:
            passed = (flagged[0].get('reason') == 'ALREADY_REDEEMED'
                      and flagged[1].get('reason') == 'DUPLICATE_IN_BATCH'
                      and failed[0].get('flag') == 'INVALID_SIGNATURE')

        self.report_card['test_sync_fraud'] = 'Passed' if passed else 'Failed'

    def test_cleanup_ticket_item(self):
        item_id = self.data.get('ticket_item_id')
        if not item_id:
            self.report_card['test_cleanup_ticket_item'] = 'Skipped'
            return

        result = self._delete(f'/api/items/{item_id}', requires_auth=True)
        self.report_card['test_cleanup_ticket_item'] = 'Passed' if result.status_code == 200 else 'Failed'


    def run_all_tests(self):
        # 1. Test utilities (Unauthenticated)
        self.test_utilities()

        # 2. Test User Creation & Login
        self.test_user_registration_and_login()

        # 3. Test Item Creation
        self.test_item_insertion_invalid()
        self.test_item_insertion()

        # 4. Test Item Fetching
        self.test_get_items()

        # 5. Test Item Updating
        self.test_update_item()

        # 6. Test Item Deletion
        self.test_delete_item()

        # 7. Ticketing Workflow
        self.test_create_ticket_item()
        self.test_generate_ticket_batch()
        self.test_request_tickets()
        self.test_sync_clean()
        self.test_sync_fraud()
        self.test_cleanup_ticket_item()

        # 8. Test User Updating and Fetching
        self.test_update_user()
        self.test_get_user()

        # 9. Test User Deletion (Cleanup)
        self.test_delete_user()

        return self.report_card

    def rout_to(self, method, endpoint, payload=None, requires_auth=False):
        print (f"Routing: {method} {endpoint}, payload: {payload}, requires_auth: {requires_auth}")
        if method == 'GET':
            return self._get(endpoint, requires_auth)
        elif method == 'POST':
            return self._post(endpoint, payload, requires_auth)
        elif method == 'PUT':
            return self._put(endpoint, payload, requires_auth)
        elif method == 'DELETE':
            return self._delete(endpoint, requires_auth)
        else:
            raise ValueError("Invalid HTTP method")


if __name__ == "__main__":
    import sys

    BASE_URL = "http://127.0.0.1:5000"
    if len(sys.argv) > 1:
        BASE_URL = sys.argv[1].rstrip("/")

    client = RealHttpClient(BASE_URL)
    tester = Tester(client)

    
    print(f"Connected to: {BASE_URL}")
    print(f"User Info: {tester.current_user_id}, Token: {tester.current_token}, ")
    print("Commands:")
    print("  run                          -- Run all automated tests")
    print("  token                        -- Show current auth token")
    print("  <METHOD> <ENDPOINT> [JSON] [auth]")
    print("  Examples:")
    print("    GET /api/time")
    print('    POST /api/login {"username":"vendor123","password":"pass"} auth')
    print("    GET /api/items auth")
    print("  quit / exit                  -- Exit")
    print("  info                         -- Show current user and token info")
    print("-- TYPE run TO GET AUTHENTICATED --")
    print()

    while True:
        try:
            com = input("> ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break

        if not com:
            continue

        if com.lower() in ('quit', 'exit'):
            break

        if com.lower() == 'info':
            print(f"Current user ID: {tester.current_user_id}")
            print(f"Current auth token: {tester.current_token}")
            continue

        if com.lower() == 'token':
            print(f"Current token: {tester.current_token}")
            continue

        if com.lower() == 'run':
            print("Running all tests...")
            report = tester.run_all_tests()
            for test, result in report.items():
                status = "PASS" if result == "Passed" else ("SKIP" if result == "Skipped" else "FAIL")
                print(f"  [{status}] {test}")
            continue

        try:
            # Parse: METHOD /endpoint [optional_json] [auth]
            parts = com.split(' ', 2)
            method = parts[0].upper()
            endpoint = parts[1]
            payload = None
            requires_auth = False

            if len(parts) > 2:
                rest = parts[2].strip()
                print ("->rest:", rest)
                # If rest ends with " auth" or " true", split that off
                if rest.lower().endswith('auth') or rest.lower().endswith('true'):
                    requires_auth = True
                    rest = rest[:-5].strip()
                    print ("->rest:", rest)

                if rest and rest != "" and rest != "{}":
                    payload = json.loads(rest)

            result = tester.rout_to(method, endpoint, payload, requires_auth)
            print(f"  {result.status_code}  {json.dumps(result.get_json(), indent=2)}")
        except json.JSONDecodeError as e:
            print(f"  JSON parse error: {e}")
        except Exception as e:
            print(f"  Error: {e}")
