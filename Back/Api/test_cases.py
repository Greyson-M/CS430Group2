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

    def test_item_insertion_invalid(self):
        # TEST CASE 1: Insert a test item into the database, This vendor id does not currently exist, so this test passing means that the endpoint is correctly validating the vendor_id and rejecting invalid ones.
        test_item = {"vendor_id": "60a7e0b5f1b2c3d4e5f6a7b8", "item_name": "Test yeah", "fields": {"field1": "value1", "field2": "value2"}}
        
        # Simulate a POST request to /api/items with the JSON payload
        result = self.client.post('/api/items', json=test_item)

        if result.status_code == 201:
            self.report_card["test_item_insertion_invalid"] = "Failed"
            print("FAIL - Test item inserted successfully with ID:", result.get_json().get("id"))
            return "Failed"
        else:
            self.report_card["test_item_insertion_invalid"] = "Passed"
            print("PASS - Failed to insert test item. Error:", result.get_json())
            return "Passed"

    def test_user_registration(self):
        # Create a test user, add to the database, and check if it was added successfully by calling 
            
        # TEST CASE 2: Register a test user and test login with that user
        test_user = {
            "user_type": "vendors",
            "username": "vendor123",
            "password": "securepassword"
        }
        
        # Simulate a POST request to /api/register
        register_result = self.client.post('/api/register', json=test_user)
        self.data['register_result'] = register_result
        
        if register_result.status_code == 201:
            print("PASS - Test user registered successfully with ID:", register_result.get_json().get("id"))
            test_user_registration = "Passed"
            self.report_card["test_user_registration"] = "Passed"
        else:
            test_user_registration = "Failed"
            self.report_card["test_user_registration"] = "Failed"
            print("FAIL - Failed to register test user.")

        # Simulate a POST request to /api/login
        login_result = self.client.post('/api/login', json={
            "username": "vendor123",
            "password": "securepassword"
        })
        
        if login_result.status_code == 200:
            print("PASS - Test user logged in successfully with token:", login_result.get_json().get("token"))
            test_user_login = "Passed"
            self.report_card["test_user_login"] = "Passed"
        else:
            test_user_login = "Failed"
            print("FAIL - Failed to log in test user.")
            self.report_card["test_user_login"] = "Failed"

        return test_user_registration, test_user_login
    
    def test_item_insertion(self):
        #use the vendor_id from the registered test user to test item insertion with a valid vendor_id
        vendor_id = self.data['register_result'].get_json().get("id")
        test_item_valid_vendor = {"vendor_id": vendor_id, "item_name": "Test yeah", "fields": {"field1": "value1", "field2": "value2"}}
        result_valid_vendor = self.client.post('/api/items', json=test_item_valid_vendor)
        if result_valid_vendor.status_code == 201:
            print("PASS - Test item inserted successfully with valid vendor ID, ID:", result_valid_vendor.get_json().get("id"))
            self.report_card["test_item_insertion_valid_vendor"] = "Passed"
        else:
            self.report_card["test_item_insertion_valid_vendor"] = "Failed"
            print("FAIL - Failed to insert test item with valid vendor ID. Error:", result_valid_vendor.get_json())

    def run_all_tests(self):
        self.test_item_insertion_invalid()
        self.test_user_registration()
        self.test_item_insertion()
        return jsonify(self.report_card)
    