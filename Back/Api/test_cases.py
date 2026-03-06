import time
import os
from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from dotenv import load_dotenv
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
        # Public endpoint
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

        # 7. Test User Updating and Fetching
        self.test_update_user()
        self.test_get_user()

        # 8. Test User Deletion (Cleanup)
        self.test_delete_user()

        return jsonify(self.report_card)