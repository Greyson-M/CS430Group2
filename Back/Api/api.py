import time
import os
from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from dotenv import load_dotenv
from bson.objectid import ObjectId
from hashlib import sha256

from test_cases import Tester

# 1. Load environment variables from the .env file
load_dotenv()

app = Flask(__name__)

# 2. Grab the MONGO_URI from the environment and add it to Flask's config
app.config["MONGO_URI"] = os.getenv("MONGO_URI")

# 3. Initialize the PyMongo extension with your app
mongo = PyMongo(app)

@app.route('/api/time')
def get_current_time():
    return {'time': time.time()}

@app.route('/api/test-db')
def test_db():
    try:
        # Pinging the database is a standard way to test the connection
        mongo.cx.admin.command('ping')
        return {"status": "success", "message": "Successfully connected to MongoDB Atlas!"}
    except Exception as e:
        return {"status": "error", "message": str(e)}, 500
    

#------------------------- Database Interaction Endpoints -------------------------#
'''
Currently Done:
MongoDB has one database we connect to called app, it has three collections: wanters, vendors, and items.
We currently have the following endpoints implemented:
- Register Endpoint: Allows users to register as either "wanters" or "vendors". The user information is stored in the appropriate collection in MongoDB.
    This automatically generates a unique ID for each user.
- Create Item Endpoint: Allows vendors to create new items. The item information is stored in the "items" collection in MongoDB,
    and each item is associated with the vendor that created it via the vendor's ID.

TODO: 
Implement Login Endpoint
- This will allow users to log in and receive a token for authentication (maybe _id for now, maybe eventually we will implement a more secure token-based system).
Implement Get Items Endpoint
- This will allow users to retrieve a list of items from the database, potentially with filtering options (e.g., by vendor, by item name, etc.).
Implement Update Item Endpoint
- This will allow vendors to update the details of their items (e.g., change the name, update fields, etc.).
Implement Delete Item Endpoint
- This will allow vendors to delete their items from the database.
Implement Get User Info, Update User Info, and Delete User Endpoints
- These will allow users to retrieve, update, and delete their own information from the database.

Need to not store passwords in plaintext, eventually we should implement password hashing for security.

'''
@app.route('/api/register', methods=['POST'])
def register():
    '''
    Register a new user.
    Expects a JSON payload with 'user_type', 'username', and 'password'.
    Example payload:
    {
        "user_type": "vendors",  # or "wanters"
        "username": "vendor123",
        "password": "securepassword"
    }
    Returns a success message and the ID of the created user.
    NOTE: Mongo automatically generates unique IDs for each document, so we don't need to handle that ourselves.
    We just need to insert the new user into the appropriate collection based on the user_type.
    TODO: Currently we are storing passwords in plaintext, eventually we should implement password hashing for security, it is not very difficult to.
    '''

    data = request.get_json()
    user_type = data.get('user_type')
    username = data.get('username')
    password = data.get('password')
    if not all([user_type, username, password]):
        return jsonify({"error": "All fields (user_type, username, password) are required"}), 400
    if user_type not in ['wanters', 'vendors']:
        return jsonify({"error": "user_type must be either 'wanters' or 'vendors'"}), 400
    #Make sure the username is unique within the collection (I don't think its strictly necessary)
    if mongo.db[user_type].find_one({"username": username}):
        return jsonify({"error": "Username already exists"}), 400    
    # Insert into the appropriate collection based on user_type
    hashed_password = sha256(password.encode()).hexdigest()
    new_user = {"username": username, "password": hashed_password}
    result = mongo.db[user_type].insert_one(new_user)
    
    return jsonify({
        "message": "User registered successfully", 
        "id": str(result.inserted_id)
    }), 201

@app.route('/api/items', methods=['POST'])
def create_item():
    '''
    Create a new item in the database.
    Expects a JSON payload with 'vendor_id', 'item_name', and optional 'fields'.
    Example payload:
    {   
        "vendor_id": "12345",
        "item_name": "My Item",
        "fields": {
            "field1": "value1",
            "field2": "value2"
        }
    }
    Returns the ID of the created item and a success message.
    '''

    data = request.get_json()
    vendor_id = data.get('vendor_id')

    # Validate that the vendor_id exists in the 'vendors' collection
    if not vendor_id or not mongo.db.vendors.find_one({"_id": ObjectId(vendor_id)}):
        return jsonify({"error": "Invalid or missing vendor_id. Make sure that the vendor exists."}), 400

    name = data.get('item_name')
    fields = data.get('fields', {}) # Defaults to an empty object if no fields are provided
    
    if not name:
        return jsonify({"error": "Item name is required"}), 400
        
    # Insert into the 'items' collection
    new_item = {"name": name, "fields": fields}
    result = mongo.db.items.insert_one(new_item)
    
    return jsonify({
        "message": "Item created successfully", 
        "id": str(result.inserted_id)
    }), 201

#----------- Stubs for future endpoints -----------#
#Inventory crud stubs
@app.route('/api/items', methods=['GET'])
def get_items():
    '''
    Get a list of items from the database.
    This endpoint will eventually support filtering options (e.g., by vendor, by item name, etc.).
    For now, it just returns all items in the database.
    '''
    return jsonify({"message": "Get items endpoint not implemented yet"}), 501

@app.route('/api/items/<item_id>', methods=['PUT'])
def update_item(item_id):
    '''
    Update the details of an item.
    Expects a JSON payload with the fields to update (e.g., 'item_name', 'fields', etc.).
    Example payload:
    {
        "item_name": "Updated Item Name",
        "fields": {
            "field1": "new value1",
            "field2": "new value2"
        }
    }
    Returns a success message if the item was updated successfully.
    '''
    return jsonify({"message": "Update item endpoint not implemented yet"}), 501

@app.route('/api/items/<item_id>', methods=['DELETE'])
def delete_item(item_id):
    '''
    Delete an item from the database.
    Returns a success message if the item was deleted successfully.
    '''
    return jsonify({"message": "Delete item endpoint not implemented yet"}), 501

# Accounts:
@app.route('/api/login', methods=['POST'])
def login():
    '''
    Login a user.
    Expects a JSON payload with 'username' and 'password'.
    Example payload:
    {
        "username": "vendor123",
        "password": "securepassword"
    }
    Returns a success message and a token for authentication (for now we can just return the user's ID, but eventually we should implement a more secure token-based system).
    '''

    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    hashed_password = sha256(password.encode()).hexdigest()

    #Authenticate against both collections since we don't know if the user is a wanter or a vendor
    user = mongo.db.vendors.find_one({"username": username, "password": hashed_password
    }) or mongo.db.wanters.find_one({"username": username, "password": hashed_password})
    if not user:
        return jsonify({"error": "Invalid username or password"}), 401
    else:
        # Return success message and user ID as token for now
        return jsonify({
            "message": "Login successful",
            "token": str(user["_id"])
        }), 200
    
@app.route('/api/user/<user_id>', methods=['GET'])
def get_user_info(user_id):
    '''
    Get the information of a user.
    Returns the user's information if the user exists.
    '''
    return jsonify({"message": "Get user info endpoint not implemented yet"}), 501

@app.route('/api/user/<user_id>', methods=['PUT'])
def update_user_info(user_id):
    '''
    Update the information of a user.
    Expects a JSON payload with the fields to update (e.g., 'username', 'password', etc.).
    Returns a success message if the user's information was updated successfully.
    '''
    return jsonify({"message": "Update user info endpoint not implemented yet"}), 501

@app.route('/api/user/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    '''
    Delete a user from the database.
    Returns a success message if the user was deleted successfully.
    '''
    return jsonify({"message": "Delete user endpoint not implemented yet"}), 501

@app.route('/api/test_cases')
def test_cases():
    '''
    This endpoint is for testing purposes. Testing guy can add test cases here to test the database connection and functionality of the endpoints.
    '''
    
    # Create the testing client to simulate real HTTP requests
    client = app.test_client()

    TesterObject = Tester(client)
    return TesterObject.run_all_tests()
