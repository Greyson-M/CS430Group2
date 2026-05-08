from flask import jsonify
from bson.objectid import ObjectId
from hashlib import sha256

class Tester:
    def __init__(self, client):
        self.client = client
        self.data = {}
        self.report_card = {}
        self.current_token = None
        self.current_user_id = None
        self.current_item_id = None
        self.second_token = None
        self.second_user_id = None

    # -------------------------------------------------------------------------
    # HELPERS
    # -------------------------------------------------------------------------
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

    def _record(self, name, passed, detail=""):
        status = "Passed" if passed else "Failed"
        self.report_card[name] = status
        print(f"{'PASS' if passed else 'FAIL'} - {name}: {detail}")

    # -------------------------------------------------------------------------
    # TC-01  Valid vendor registration
    # -------------------------------------------------------------------------
    def tc01_valid_vendor_registration(self):
        res = self._post('/api/register', {
            "user_type": "vendors",
            "username": "vendor_test_tc01",
            "password": "pass123"
        })
        passed = res.status_code == 201
        if passed:
            self.current_user_id = res.get_json().get("id")
        self._record("TC-01_valid_vendor_registration", passed, f"status={res.status_code}")

    # -------------------------------------------------------------------------
    # TC-02  Valid wanter registration
    # -------------------------------------------------------------------------
    def tc02_valid_wanter_registration(self):
        res = self._post('/api/register', {
            "user_type": "wanters",
            "username": "wanter_test_tc02",
            "password": "pass123"
        })
        passed = res.status_code == 201
        if passed:
            self.second_user_id = res.get_json().get("id")
        self._record("TC-02_valid_wanter_registration", passed, f"status={res.status_code}")

    # -------------------------------------------------------------------------
    # TC-03  Duplicate username blocked
    # -------------------------------------------------------------------------
    def tc03_duplicate_username_blocked(self):
        res = self._post('/api/register', {
            "user_type": "vendors",
            "username": "vendor_test_tc01",
            "password": "pass123"
        })
        passed = res.status_code == 400
        self._record("TC-03_duplicate_username_blocked", passed, f"status={res.status_code}")

    # -------------------------------------------------------------------------
    # TC-04  Invalid user_type rejected
    # -------------------------------------------------------------------------
    def tc04_invalid_user_type_rejected(self):
        res = self._post('/api/register', {
            "user_type": "admins",
            "username": "hacker",
            "password": "pass"
        })
        passed = res.status_code == 400
        self._record("TC-04_invalid_user_type_rejected", passed, f"status={res.status_code}")

    # -------------------------------------------------------------------------
    # TC-05  Missing fields on registration rejected
    # -------------------------------------------------------------------------
    def tc05_missing_fields_registration(self):
        res = self._post('/api/register', {"user_type": "vendors"})
        passed = res.status_code == 400
        self._record("TC-05_missing_fields_registration", passed, f"status={res.status_code}")

    # -------------------------------------------------------------------------
    # TC-06  Valid login returns token
    # -------------------------------------------------------------------------
    def tc06_valid_login(self):
        res = self._post('/api/login', {
            "username": "vendor_test_tc01",
            "password": "pass123"
        })
        passed = res.status_code == 200 and "token" in res.get_json()
        if passed:
            self.current_token = res.get_json().get("token")
        self._record("TC-06_valid_login", passed, f"status={res.status_code}")

    # -------------------------------------------------------------------------
    # TC-07  Wrong password rejected
    # -------------------------------------------------------------------------
    def tc07_invalid_login(self):
        res = self._post('/api/login', {
            "username": "vendor_test_tc01",
            "password": "wrongpassword"
        })
        passed = res.status_code == 401
        self._record("TC-07_invalid_login", passed, f"status={res.status_code}")

    # -------------------------------------------------------------------------
    # TC-08  Non-existent username rejected
    # -------------------------------------------------------------------------
    def tc08_nonexistent_user_login(self):
        res = self._post('/api/login', {
            "username": "ghost_user_xyz",
            "password": "pass123"
        })
        passed = res.status_code == 401
        self._record("TC-08_nonexistent_user_login", passed, f"status={res.status_code}")

    # -------------------------------------------------------------------------
    # TC-09  Valid item creation with auth
    # -------------------------------------------------------------------------
    def tc09_valid_item_creation(self):
        if not self.current_user_id:
            self._record("TC-09_valid_item_creation", False, "no user_id")
            return
        res = self._post('/api/items', {
            "vendor_id": self.current_user_id,
            "item_name": "Test Item TC09",
            "fields": {"color": "blue"}
        }, requires_auth=True)
        passed = res.status_code == 201
        if passed:
            self.current_item_id = res.get_json().get("id")
        self._record("TC-09_valid_item_creation", passed, f"status={res.status_code}")

    # -------------------------------------------------------------------------
    # TC-10  Invalid vendor ID rejected
    # -------------------------------------------------------------------------
    def tc10_invalid_vendor_id(self):
        res = self._post('/api/items', {
            "vendor_id": "60a7e0b5f1b2c3d4e5f6a7b8",
            "item_name": "Ghost Item"
        }, requires_auth=True)
        passed = res.status_code in [400, 403]
        self._record("TC-10_invalid_vendor_id", passed, f"status={res.status_code}")

    # -------------------------------------------------------------------------
    # TC-11  Missing item name rejected
    # -------------------------------------------------------------------------
    def tc11_missing_item_name(self):
        if not self.current_user_id:
            self._record("TC-11_missing_item_name", False, "no user_id")
            return
        res = self._post('/api/items', {
            "vendor_id": self.current_user_id,
            "fields": {"color": "red"}
        }, requires_auth=True)
        passed = res.status_code == 400
        self._record("TC-11_missing_item_name", passed, f"status={res.status_code}")

    # -------------------------------------------------------------------------
    # TC-12  Get items returns list
    # -------------------------------------------------------------------------
    def tc12_get_items(self):
        res = self._get('/api/items')
        passed = res.status_code == 200 and isinstance(res.get_json(), list)
        self._record("TC-12_get_items", passed, f"status={res.status_code}")

    # -------------------------------------------------------------------------
    # TC-13  Update item with valid owner
    # -------------------------------------------------------------------------
    def tc13_update_item(self):
        if not self.current_item_id:
            self._record("TC-13_update_item", False, "no item_id")
            return
        res = self._put(f'/api/items/{self.current_item_id}', {
            "item_name": "Updated Item TC13"
        }, requires_auth=True)
        passed = res.status_code == 200
        self._record("TC-13_update_item", passed, f"status={res.status_code}")

    # -------------------------------------------------------------------------
    # TC-14  Unauthorized user cannot update item
    # -------------------------------------------------------------------------
    def tc14_unauthorized_item_update(self):
        if not self.current_item_id:
            self._record("TC-14_unauthorized_item_update", False, "no item_id")
            return
        # Login as second user
        login_res = self._post('/api/login', {
            "username": "wanter_test_tc02",
            "password": "pass123"
        })
        if login_res.status_code != 200:
            self._record("TC-14_unauthorized_item_update", False, "second login failed")
            return
        second_token = login_res.get_json().get("token")
        # Try to update item owned by first user using second user token
        res = self.client.put(
            f'/api/items/{self.current_item_id}',
            json={"item_name": "Hacked Item"},
            headers={"Authorization": f"Bearer {second_token}"}
        )
        passed = res.status_code == 403
        self._record("TC-14_unauthorized_item_update", passed, f"status={res.status_code}")

    # -------------------------------------------------------------------------
    # TC-15  Delete item with valid owner
    # -------------------------------------------------------------------------
    def tc15_delete_item(self):
        if not self.current_item_id:
            self._record("TC-15_delete_item", False, "no item_id")
            return
        res = self._delete(f'/api/items/{self.current_item_id}', requires_auth=True)
        passed = res.status_code == 200
        self._record("TC-15_delete_item", passed, f"status={res.status_code}")

    # -------------------------------------------------------------------------
    # TC-16  Get user info
    # -------------------------------------------------------------------------
    def tc16_get_user_info(self):
        if not self.current_user_id:
            self._record("TC-16_get_user_info", False, "no user_id")
            return
        res = self._get(f'/api/user/{self.current_user_id}', requires_auth=True)
        passed = res.status_code == 200
        self._record("TC-16_get_user_info", passed, f"status={res.status_code}")

    # -------------------------------------------------------------------------
    # TC-17  Unauthorized user cannot view another user
    # -------------------------------------------------------------------------
    def tc17_unauthorized_user_access(self):
        if not self.current_user_id:
            self._record("TC-17_unauthorized_user_access", False, "no user_id")
            return
        login_res = self._post('/api/login', {
            "username": "wanter_test_tc02",
            "password": "pass123"
        })
        if login_res.status_code != 200:
            self._record("TC-17_unauthorized_user_access", False, "second login failed")
            return
        second_token = login_res.get_json().get("token")
        res = self.client.get(
            f'/api/user/{self.current_user_id}',
            headers={"Authorization": f"Bearer {second_token}"}
        )
        passed = res.status_code == 403
        self._record("TC-17_unauthorized_user_access", passed, f"status={res.status_code}")

    # -------------------------------------------------------------------------
    # TC-18  Update user info
    # -------------------------------------------------------------------------
    def tc18_update_user(self):
        if not self.current_user_id:
            self._record("TC-18_update_user", False, "no user_id")
            return
        res = self._put(f'/api/user/{self.current_user_id}', {
            "username": "vendor_test_tc01_updated"
        }, requires_auth=True)
        passed = res.status_code == 200
        self._record("TC-18_update_user", passed, f"status={res.status_code}")

    # -------------------------------------------------------------------------
    # CLEANUP — delete both test users
    # -------------------------------------------------------------------------
    def cleanup(self):
        if self.current_user_id:
            self._delete(f'/api/user/{self.current_user_id}', requires_auth=True)

        if self.second_user_id:
            login_res = self._post('/api/login', {
                "username": "wanter_test_tc02",
                "password": "pass123"
            })
            if login_res.status_code == 200:
                second_token = login_res.get_json().get("token")
                self.client.delete(
                    f'/api/user/{self.second_user_id}',
                    headers={"Authorization": f"Bearer {second_token}"}
                )

    # -------------------------------------------------------------------------
    # RUN ALL
    # -------------------------------------------------------------------------
    def run_all_tests(self):
        self.tc01_valid_vendor_registration()
        self.tc02_valid_wanter_registration()
        self.tc03_duplicate_username_blocked()
        self.tc04_invalid_user_type_rejected()
        self.tc05_missing_fields_registration()
        self.tc06_valid_login()
        self.tc07_invalid_login()
        self.tc08_nonexistent_user_login()
        self.tc09_valid_item_creation()
        self.tc10_invalid_vendor_id()
        self.tc11_missing_item_name()
        self.tc12_get_items()
        self.tc13_update_item()
        self.tc14_unauthorized_item_update()
        self.tc15_delete_item()
        self.tc16_get_user_info()
        self.tc17_unauthorized_user_access()
        self.tc18_update_user()
        self.cleanup()

        total = len(self.report_card)
        passed = sum(1 for v in self.report_card.values() if v == "Passed")
        self.report_card["_summary"] = f"{passed}/{total} tests passed"
        return jsonify(self.report_card)