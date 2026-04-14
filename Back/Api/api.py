import time
import os
from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from dotenv import load_dotenv
from bson.objectid import ObjectId
from hashlib import sha256
import jwt
from functools import wraps
import datetime
from flask_cors import CORS
import secrets

# Load the private key for signing tickets (Ensure the file path is correct for your environment)
with open('jwtRS256.key', 'r') as f:
    PRIVATE_KEY = f.read()

from test_cases import Tester

# Load environment variables from the .env file
load_dotenv()

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = 'big_secret_herebig_secret_herebig_secret_herebig_secret_here'  # In production, use a more secure secret key and store it safely (e.g., in environment variables)

# Get the MONGO_URI from the environment and add it to Flask's config
app.config["MONGO_URI"] = os.getenv("MONGO_URI")

# Initialize the PyMongo extension with your app
mongo = PyMongo(app)

# Define token_required decorator for protected endpoints
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Check if the token is provided in the Authorization header
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]  # Expecting "Bearer <token>"
        
        if not token:
            return jsonify({"error": "Token is missing!"}), 401
        
        try:
            # Decode the token using the secret key
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user_id = data['user_id']

        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token is invalid!'}), 401

        # Pass the decoded user ID to the route
        return f(current_user_id, *args, **kwargs)

    return decorated

#enpoint that takes a authtoken as input and returns whether the token is currently valid (i.e., not expired and properly signed).
@app.route('/api/validate-token', methods=['POST'])
@token_required
def validate_token(current_user_id):
    return jsonify({"message": "Token is valid", "user_id": current_user_id}), 200

@app.route('/api/invalidate-all-tokens', methods=['GET', 'POST'])   #Technically, should just be a POST or PUT since it is changing server state, but since this is just a testing endpoint and not something that will be exposed to users, it is much easier to test if it is a GET endpoint that can be easily accessed from the browser.
def invalidate_all_tokens():
    '''
    Testing endpoint: Invalidates all existing JWT tokens by rotating the secret key.
    All users will need to log in again.
    '''
    app.config['SECRET_KEY'] = secrets.token_hex(32)
    return jsonify({"message": "All tokens have been invalidated. Users must log in again."}), 200

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
- Get Items Endpoint
    - This will allow users to retrieve a list of items from the database, potentially with filtering options (e.g., by vendor, by item name, etc.).
- Update Item Endpoint
    - This will allow vendors to update the details of their items (e.g., change the name, update fields, etc.).
- Delete Item Endpoint
    - This will allow vendors to delete their items from the database.
- Get User Info, Update User Info, and Delete User Endpoints
    - These will allow users to retrieve, update, and delete their own information from the database.
- Login Endpoint
    - This will allow users to log in and receive a token for authentication (maybe _id for now, maybe eventually we will implement a more secure token-based system).
    - Need to not store passwords in plaintext, eventually we should implement password hashing for security.
Additional Done:
 - Clarify handling of tokens for authentication and authorization (e.g., how to associate tokens with users, how to verify tokens for protected endpoints, etc.)
 - Test what is currently implemented and make sure it works as expected.
 - Protect update item and delete item endpoints (must be logged in and owner of the item to update/delete).
 - Change get_user_info, update_user_info, and delete_user_info to post user_id in the body instead of the URL. must also be logged in and owner of the account to update/delete.
 - Implement authentication and authorization for the endpoints (e.g., only allow vendors to create/update/delete items, only allow users to update/delete their own information, etc.).

TODO: 
Immediate Next Steps:
 - Code review then merge what is currently implemented into the main branch.

Future Improvements:
 - Implement more robust error handling and input validation for the endpoints, if necessary.
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

    user_type = None
    user = mongo.db.vendors.find_one({"username": username, "password": hashed_password})
    if user:
        user_type = "vendors"
    else:
        user = mongo.db.wanters.find_one({"username": username, "password": hashed_password})
        if user:
            user_type = "wanters"

    if not user:
        return jsonify({"error": "Invalid username or password"}), 401

    # Include user_type in the JWT
    token = jwt.encode({
        'user_id': str(user['_id']),
        'user_type': user_type,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }, app.config['SECRET_KEY'], algorithm="HS256")

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user_type": user_type
    }), 200


@app.route('/api/items', methods=['POST'])
@token_required
def create_item(current_user_id):
    '''
    Create a new item in the database.
    Requires Authorization header.
    Expects a JSON payload with 'vendor_id', 'item_name', and optional 'fields'.
    '''

    data = request.get_json()
    vendor_id = data.get('vendor_id')

    # AUTHORIZATION CHECK: Ensure the user is creating an item for their own account
    if vendor_id != current_user_id:
        return jsonify({"error": "Unauthorized: You can only create items for your own account"}), 403

    # Validate that the vendor_id exists in the 'vendors' collection
    if not vendor_id or not mongo.db.vendors.find_one({"_id": ObjectId(vendor_id)}):
        return jsonify({"error": "Invalid or missing vendor_id. Make sure that the vendor exists."}), 400

    name = data.get('item_name')
    fields = data.get('fields', {}) # Defaults to an empty object if no fields are provided
    
    if not name:
        return jsonify({"error": "Item name is required"}), 400
        
    # Insert into the 'items' collection
    new_item = {"vendor_id": ObjectId(vendor_id), "name": name, "vendor_id": vendor_id, "fields": fields}
    result = mongo.db.items.insert_one(new_item)
    
    return jsonify({
        "message": "Item created successfully", 
        "id": str(result.inserted_id)
    }), 201

@app.route('/api/items', methods=['GET'])
def get_items():
    '''
    Get a list of items from the database.
    This endpoint will eventually support filtering options (e.g., by vendor, by item name, etc.).
    For now, it just returns all items in the database.
    '''
    try:
        # Optional filters
        vendor_id = request.args.get('vendor_id')
        item_name = request.args.get('item_name')

        query = {}

        if vendor_id:
            try:
                query['vendor_id'] = ObjectId(vendor_id)
            except Exception:
                return jsonify({"error": "Invalid vendor_id format"}), 400
            
        if item_name:
            # Simple case-insensitive partial match
            query['name'] = {"$regex": item_name, "$options": "i"}

        items_cursor = mongo.db.items.find(query)
        items = []
        for item in items_cursor:
            item['_id'] = str(item['_id'])  # Convert ObjectId to string for JSON serialization
            # if vendor_id exists
            if 'vendor_id' in item and item['vendor_id'] is not None:
                item['vendor_id'] = str(item['vendor_id'])  # Convert ObjectId to string for JSON serialization
            items.append(item)
        
        return jsonify(items), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/items/<item_id>', methods=['PUT'])
@token_required
def update_item(current_user_id, item_id):
    '''
    Update the details of an item.
    Requires Authorization header.
    '''
    try:
        try:
            item_obj_id = ObjectId(item_id)
        except Exception:
            return jsonify({"error": "Invalid item_id format"}), 400
        
        # 1. Fetch the item to check ownership
        item = mongo.db.items.find_one({"_id": item_obj_id})
        if not item:
            return jsonify({"error": "Item not found"}), 404

        # 2. AUTHORIZATION CHECK
        if str(item.get('vendor_id')) != current_user_id:
            return jsonify({"error": "Unauthorized: You do not own this item"}), 403
        
        data = request.get_json() or {}

        update_doc = {}
        if 'item_name' in data:
            if not data.get('item_name'):
                return jsonify({"error": "Item name cannot be empty"}), 400
            update_doc['name'] = data.get('item_name')

        if 'fields' in data:
            if not isinstance(data.get('fields'), dict):
                return jsonify({"error": "Fields must be a JSON object"}), 400
            update_doc['fields'] = data.get('fields')

        if not update_doc:
            return jsonify({"error": "No valid fields to update"}), 400
        
        result = mongo.db.items.update_one({"_id": item_obj_id}, {"$set": update_doc})
        
        return jsonify({"message": "Item updated successfully"}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/items/<item_id>', methods=['DELETE'])
@token_required
def delete_item(current_user_id, item_id):
    '''
    Delete an item from the database.
    Requires Authorization header.
    '''
    try:
        try:
            item_obj_id = ObjectId(item_id)
        except Exception:
            return jsonify({"error": "Invalid item_id format"}), 400
        
        # 1. Fetch the item to check ownership
        item = mongo.db.items.find_one({"_id": item_obj_id})
        if not item:
            return jsonify({"error": "Item not found"}), 404

        # 2. AUTHORIZATION CHECK
        if str(item.get('vendor_id')) != current_user_id:
            return jsonify({"error": "Unauthorized: You do not own this item"}), 403
        
        result = mongo.db.items.delete_one({"_id": item_obj_id})
        
        return jsonify({"message": "Item deleted successfully"}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# Accounts:
@app.route('/api/user/<user_id>', methods=['GET'])
@token_required
def get_user_info(current_user_id, user_id):
    '''
    Get the information of a user.
    Requires Authorization header.
    '''
    # AUTHORIZATION CHECK
    if current_user_id != user_id:
        return jsonify({"error": "Unauthorized: You can only view your own account"}), 403
    
    try:
        try:
            user_obj_id = ObjectId(user_id)
        except Exception:
            return jsonify({"error": "Invalid user_id format"}), 400
        
        # Search for the user in both collections
        user = mongo.db.vendors.find_one({"_id": user_obj_id}) or mongo.db.wanters.find_one({"_id": user_obj_id})
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Convert ObjectId to string for JSON serialization
        user['_id'] = str(user['_id'])
        # Never return password hashes
        if 'password' in user:
            del user['password']
        
        # Add a helpful field for client-side
        if mongo.db.vendors.find_one({"_id": user_obj_id}):
            user['user_type'] = 'vendors'
        else:
            user['user_type'] = 'wanters'
        
        return jsonify(user), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/user/<user_id>', methods=['PUT'])
@token_required
def update_user_info(current_user_id, user_id):
    '''
    Update the information of a user.
    Requires Authorization header.
    '''
    # AUTHORIZATION CHECK
    if current_user_id != user_id:
        return jsonify({"error": "Unauthorized: You can only update your own account"}), 403
    
    try:
        try:
            user_obj_id = ObjectId(user_id)
        except Exception:
            return jsonify({"error": "Invalid user_id format"}), 400

        data = request.get_json() or {}

        username = data.get("username")
        password = data.get("password")

        if username is None and password is None:
            return jsonify({"error": "No fields provided to update"}), 400

        # Determine which collection the user belongs to
        collection_name = None
        if mongo.db.vendors.find_one({"_id": user_obj_id}):
            collection_name = "vendors"
        elif mongo.db.wanters.find_one({"_id": user_obj_id}):
            collection_name = "wanters"
        else:
            return jsonify({"error": "User not found"}), 404

        update_doc = {}

        if username is not None:
            if not username:
                return jsonify({"error": "username cannot be empty"}), 400
            # Ensure username uniqueness in that collection
            existing = mongo.db[collection_name].find_one({"username": username, "_id": {"$ne": user_obj_id}})
            if existing:
                return jsonify({"error": "Username already exists"}), 400
            update_doc["username"] = username

        if password is not None:
            if not password:
                return jsonify({"error": "password cannot be empty"}), 400
            update_doc["password"] = sha256(password.encode()).hexdigest()

        result = mongo.db[collection_name].update_one({"_id": user_obj_id}, {"$set": update_doc})

        if result.matched_count == 0:
            return jsonify({"error": "User not found"}), 404

        return jsonify({"message": "User updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/user/<user_id>', methods=['DELETE'])
@token_required
def delete_user(current_user_id, user_id):
    '''
    Delete a user from the database.
    Requires Authorization header.
    '''
    # AUTHORIZATION CHECK
    if current_user_id != user_id:
        return jsonify({"error": "Unauthorized: You can only delete your own account"}), 403
    
    try:
        try:
            user_obj_id = ObjectId(user_id)
        except Exception:
            return jsonify({"error": "Invalid user_id format"}), 400

        # Try deleting from vendors first, then wanters
        result_vendor = mongo.db.vendors.delete_one({"_id": user_obj_id})
        if result_vendor.deleted_count > 0:
            return jsonify({"message": "User deleted successfully"}), 200

        result_wanter = mongo.db.wanters.delete_one({"_id": user_obj_id})
        if result_wanter.deleted_count > 0:
            return jsonify({"message": "User deleted successfully"}), 200

        return jsonify({"error": "User not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
#------------------------- Ticketing Endpoints -------------------------#

@app.route('/api/tickets', methods=['POST'])
@token_required
def generate_ticket(current_user_id):
    '''
    HAVER (Vendor) GENERATES TICKET INVENTORY
    Expects JSON: { "item_id": "...", "quantity": 100 }
    '''
    # 1. Authorization: Ensure user is a vendor
    vendor = mongo.db.vendors.find_one({"_id": ObjectId(current_user_id)})
    if not vendor:
        return jsonify({"error": "Unauthorized: Only vendors (Havers) can generate tickets"}), 403

    data = request.get_json()
    item_id = data.get('item_id')
    total_qty = data.get('quantity')

    if not item_id or not isinstance(total_qty, int) or total_qty <= 0:
        return jsonify({"error": "Valid item_id and positive quantity are required"}), 400

    # Verify the item exists and belongs to this vendor
    item = mongo.db.items.find_one({"_id": ObjectId(item_id), "vendor_id": ObjectId(current_user_id)})
    if not item:
        return jsonify({"error": "Item not found or does not belong to you"}), 404

    # 2. Create the ticket inventory record
    new_ticket_batch = {
        "vendor_id": ObjectId(current_user_id),
        "item_id": ObjectId(item_id),
        "total_qty": total_qty,
        "available_qty": total_qty, # State management: track available vs total
        "created_at": datetime.datetime.utcnow()
    }
    
    result = mongo.db.tickets.insert_one(new_ticket_batch)
    
    return jsonify({
        "message": "Ticket inventory generated successfully",
        "ticket_batch_id": str(result.inserted_id)
    }), 201


@app.route('/api/tickets/<ticket_batch_id>/request', methods=['POST'])
@token_required
def request_ticket(current_user_id, ticket_batch_id):
    '''
    WANTER REQUESTS TICKET
    Checks availability, updates state (instead of deleting), and returns a Signed JWT.
    '''
    # 1. Authorization: Ensure user is a wanter
    wanter = mongo.db.wanters.find_one({"_id": ObjectId(current_user_id)})
    if not wanter:
        return jsonify({"error": "Unauthorized: Only wanters can request tickets"}), 403

    try:
        batch_obj_id = ObjectId(ticket_batch_id)
    except Exception:
        return jsonify({"error": "Invalid ticket_batch_id format"}), 400

    # 2. Atomic update: Find batch with available quantity and decrement it by 1
    # This prevents race conditions if multiple wanters request at the exact same time
    ticket_batch = mongo.db.tickets.find_one_and_update(
        {"_id": batch_obj_id, "available_qty": {"$gt": 0}},
        {"$inc": {"available_qty": -1}},
        return_document=True
    )

    if not ticket_batch:
        return jsonify({"error": "Tickets sold out or invalid ticket batch"}), 400

    # 3. State Management: Create a specific Claimed Ticket record for this user
    claimed_ticket = {
        "ticket_batch_id": batch_obj_id,
        "wanter_id": ObjectId(current_user_id),
        "item_id": ticket_batch['item_id'],
        "vendor_id": ticket_batch['vendor_id'],
        "status": "Pending Redemption", # Changed from immediate deletion to state tracking
        "claimed_at": datetime.datetime.utcnow()
    }
    claim_result = mongo.db.claimed_tickets.insert_one(claimed_ticket)
    claimed_ticket_id = str(claim_result.inserted_id)

    # 4. Generate the Asymmetric Digitally Signed Ticket (The QR Code payload)
    # We use RS256 so the offline Haver can verify it using only the Public Key
    expiration_time = datetime.datetime.utcnow() + datetime.timedelta(days=30) # 30 day expiration
    
    ticket_payload = {
        "ticket_id": claimed_ticket_id,       # Unique ID for local device blacklisting
        "item_id": str(ticket_batch['item_id']),
        "wanter_id": current_user_id,
        "exp": expiration_time                # Prevents forever-valid tickets
    }

    signed_ticket = jwt.encode(ticket_payload, PRIVATE_KEY, algorithm="RS256")

    return jsonify({
        "message": "Ticket claimed successfully",
        "qr_payload": signed_ticket,
        "ticket_id": claimed_ticket_id
    }), 200

@app.route('/api/test_cases')
def test_cases():
    '''
    This endpoint is for testing purposes. Testing guy can add test cases here to test the database connection and functionality of the endpoints.
    '''
    
    # Create the testing client to simulate real HTTP requests
    client = app.test_client()

    TesterObject = Tester(client)
    return TesterObject.run_all_tests()
