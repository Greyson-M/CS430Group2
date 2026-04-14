# API Documentation

## Authentication & Authorization

This API uses **JSON Web Tokens (JWT)** for securing protected endpoints. 

When a user logs in via `/login`, the server returns a `token`. For any endpoint marked as **Requires Auth**, you must include this token in the HTTP Headers of your request.

**Header Format:**
```http
Authorization: Bearer <your_jwt_token_here>
```

**Frontend Usage:**
```javascript
// Example using fetch in JavaScript, there are many alternative usages which are likely better than this one, but this illustrates how to include the token in the header for authenticated requests.

const token = localStorage.getItem('authToken'); // where the actual token received from /login is stored 
fetch('/api/protected-endpoint', {
    method: 'GET', // or 'POST', 'PUT', etc. depending on the endpoint
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    // body: JSON.stringify(data) // Include this for POST/PUT requests
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

## Authentication (`/api/register` & `/api/login`)

### Register a User
* **Endpoint:** `POST /api/register`
* **Description:** Registers a new user as either a vendor or a wanter. Username must be unique within the selected collection.
* **Requires Auth:** No
* **Request Body (JSON):**
    ```json
    {
        "user_type": "vendors", // Must be strictly 'vendors' or 'wanters'
        "username": "vendor123",
        "password": "securepassword"
    }
    ```
* **Success Response (201 Created):**
    ```json
    {
        "message": "User registered successfully",
        "id": "64a7b8f9e4b0123456789abc"
    }
    ```
* **Error Responses:** * `400 Bad Request` if fields are missing, `user_type` is invalid, or username already exists.

### Login
* **Endpoint:** `POST /api/login`
* **Description:** Authenticates a user against both vendors and wanters collections and returns a JWT token valid for 1 hour.
* **Requires Auth:** No
* **Request Body (JSON):**
    ```json
    {
        "username": "vendor123",
        "password": "securepassword"
    }
    ```
* **Success Response (200 OK):**
    ```json
    {
        "message": "Login successful",
        "token": "eyJhbGciOiJIUzI1NiIsInR5c..."
    }
    ```
* **Error Responses:**
    * `401 Unauthorized` for invalid username or password.

---

## User Management (`/api/user`)

### Get User Info
* **Endpoint:** `GET /api/user/<user_id>`
* **Description:** Fetches details about a specific user. *Note: Password hashes are never returned. Users can only view their own account.*
* **Requires Auth:** Yes (`Authorization: Bearer <token>`)
* **Success Response (200 OK):**
    ```json
    {
        "_id": "64a7b8f9e4b0123456789abc",
        "username": "vendor123",
        "user_type": "vendors"
    }
    ```
* **Error Responses:**
    * `403 Forbidden` if the authenticated user tries to access a different user's ID.
    * `404 Not Found` if the user does not exist.

### Update User Info
* **Endpoint:** `PUT /api/user/<user_id>`
* **Description:** Updates a user's username or password. Both fields are optional, but at least one must be provided. Users can only update their own account.
* **Requires Auth:** Yes (`Authorization: Bearer <token>`)
* **Request Body (JSON):**
    ```json
    {
        "username": "new_vendor_name",
        "password": "new_secure_password"
    }
    ```
* **Success Response (200 OK):**
    ```json
    {
        "message": "User updated successfully"
    }
    ```

### Delete User
* **Endpoint:** `DELETE /api/user/<user_id>`
* **Description:** Deletes a user account entirely. Users can only delete their own account.
* **Requires Auth:** Yes (`Authorization: Bearer <token>`)
* **Success Response (200 OK):**
    ```json
    {
        "message": "User deleted successfully"
    }
    ```

---

## Inventory Management (`/api/items`)

### Create Item
* **Endpoint:** `POST /api/items`
* **Description:** Creates a new item associated with a vendor. The logged-in user must match the `vendor_id`.
* **Requires Auth:** Yes (`Authorization: Bearer <token>`)
* **Request Body (JSON):**
    ```json
    {   
        "vendor_id": "64a7b8f9e4b0123456789abc",
        "item_name": "My Awesome Item",
        "fields": {
            "color": "red",
            "size": "large"
        }
    }
    ```
    *(Note: `fields` is optional and defaults to an empty object if omitted)*
* **Success Response (201 Created):**
    ```json
    {
        "message": "Item created successfully",
        "id": "64a7c1a2e4b0123456789def"
    }
    ```
* **Error Responses:**
    * `403 Forbidden` if you attempt to create an item for a different `vendor_id`.
    * `400 Bad Request` if `item_name` is missing or `vendor_id` doesn't exist.

### Get Items
* **Endpoint:** `GET /api/items`
* **Description:** Retrieves a list of items. Can be filtered using query parameters.
* **Requires Auth:** No
* **Query Parameters:**
    * `vendor_id` (optional): Filter items belonging to a specific vendor.
    * `item_name` (optional): Performs a case-insensitive partial match on the item name.
* **Example Request:** `GET /api/items?vendor_id=64a7b8f9e4b0123456789abc&item_name=awesome`
* **Success Response (200 OK):**
    ```json
    [
        {
            "_id": "64a7c1a2e4b0123456789def",
            "vendor_id": "64a7b8f9e4b0123456789abc",
            "name": "My Awesome Item",
        }
    ]
    ```

### Update Item
* **Endpoint:** `PUT /api/items/<item_id>`
* **Description:** Updates the `item_name` and/or `fields` object of an existing item. The logged-in user must be the vendor who owns this item.
* **Requires Auth:** Yes (`Authorization: Bearer <token>`)
* **Request Body (JSON):**
    ```json
    {
        "item_name": "Updated Item Name",
        "fields": {
            "color": "blue",
            "size": "medium"
        }
    }
    ```
* **Success Response (200 OK):**
    ```json
    {
        "message": "Item updated successfully"
    }
    ```

### Delete Item
* **Endpoint:** `DELETE /api/items/<item_id>`
* **Description:** Deletes a specific item. The logged-in user must be the vendor who owns this item.
* **Requires Auth:** Yes (`Authorization: Bearer <token>`)
* **Success Response (200 OK):**
    ```json
    {
        "message": "Item deleted successfully"
    }
    ```

---

## Ticketing (`/api/tickets`)

### Generate Ticket Batch
* **Endpoint:** `POST /api/tickets`
* **Description:** Creates a new pool of available tickets (a "batch") for a specific item. Only the vendor who owns the item can generate tickets for it. The batch tracks total and available quantities.
* **Requires Auth:** Yes (`Authorization: Bearer <token>`)
* **Request Body (JSON):**
    ```json
    {
        "item_id": "64a7c1a2e4b0123456789def",
        "quantity": 100
    }
    ```
* **Success Response (201 Created):**
    ```json
    {
        "message": "Ticket inventory generated successfully",
        "ticket_batch_id": "64a7d3b4e4b0123456789aaa"
    }
    ```
* **Error Responses:**
    * `403 Forbidden` if the authenticated user is not a vendor.
    * `400 Bad Request` if `item_id` is missing or `quantity` is not a positive integer.
    * `404 Not Found` if the item does not exist or does not belong to the vendor.

### Request Ticket (Claim)
* **Endpoint:** `POST /api/tickets/<ticket_batch_id>/request`
* **Description:** Allows a wanter (recipient) to claim one ticket from an available batch. Atomically decrements the batch's `available_qty`, creates a `claimed_ticket` record with status `"Pending Redemption"`, and returns an RS256-signed JWT (the QR code payload) that can be verified offline by the distributor.
* **Requires Auth:** Yes (`Authorization: Bearer <token>`)
* **Success Response (200 OK):**
    ```json
    {
        "message": "Ticket claimed successfully",
        "qr_payload": "eyJhbGciOiJSUzI1NiIsInR5c...",
        "ticket_id": "64a7e5c6e4b0123456789bbb"
    }
    ```
* **Error Responses:**
    * `403 Forbidden` if the authenticated user is not a wanter.
    * `400 Bad Request` if the ticket batch is sold out or the `ticket_batch_id` is invalid.

### Post-Hoc Redemption Sync
* **Endpoint:** `POST /api/tickets/sync`
* **Description:** Processes an offline redemption ledger uploaded by a distributor. When a distributor scans QR codes offline, the scanned payloads are stored locally on the device. When internet connectivity is restored, this endpoint is called to sync the ledger with the server. For each transaction, the endpoint:
    1. **Verifies** the RS256 JWT signature using the server's public key.
    2. **Detects fraud**: duplicate tickets within the same batch, tickets already redeemed in a prior sync, tickets not found in the database, expired JWTs, and tampered/invalid signatures.
    3. **Updates** the `claimed_tickets` collection, setting status to `"Redeemed"` with a timestamp.
    4. **Decrements** the ticket batch's `total_qty` for each successful redemption.
    5. **Logs** every transaction (success, flagged, or rejected) to the `sync_logs` collection.
    6. **Returns** a fraud report summarizing the results.
* **Requires Auth:** Yes (`Authorization: Bearer <token>`) -- Vendor (distributor) only.
* **Request Body (JSON):**
    ```json
    {
        "transactions": [
            {
                "qr_payload": "eyJhbGciOiJSUzI1NiIsInR5c...",
                "scanned_at": "2026-04-10T14:30:00Z"
            },
            {
                "qr_payload": "eyJhbGciOiJSUzI1NiIsInR5c...",
                "scanned_at": "2026-04-10T14:31:00Z"
            }
        ]
    }
    ```
    * `qr_payload` (required): The RS256-signed JWT string from the scanned QR code.
    * `scanned_at` (optional): ISO 8601 timestamp of when the QR code was scanned offline. Defaults to current server time if omitted.
* **Success Response (200 OK):**
    ```json
    {
        "sync_summary": {
            "total_submitted": 5,
            "successfully_redeemed": 3,
            "flagged_count": 1,
            "failed_count": 1
        },
        "processed": [
            {
                "index": 0,
                "ticket_id": "64a7e5c6e4b0123456789bbb",
                "item_id": "64a7c1a2e4b0123456789def",
                "status": "Redeemed"
            }
        ],
        "flagged": [
            {
                "index": 3,
                "ticket_id": "64a7e5c6e4b0123456789bbb",
                "reason": "ALREADY_REDEEMED",
                "detail": "Ticket was already marked as redeemed"
            }
        ],
        "failed": [
            {
                "index": 4,
                "reason": "Invalid or tampered JWT signature",
                "flag": "INVALID_SIGNATURE"
            }
        ],
        "synced_at": "2026-04-13T18:00:00.000000"
    }
    ```
* **Fraud Flag Types:**
    * `DUPLICATE_IN_BATCH` -- The same ticket appeared multiple times in the submitted transaction list.
    * `ALREADY_REDEEMED` -- The ticket was already marked as redeemed in a previous sync.
    * `TICKET_NOT_FOUND` -- No matching claimed ticket record exists in the database.
    * `EXPIRED` -- The ticket's JWT has passed its expiration date.
    * `INVALID_SIGNATURE` -- The JWT signature is invalid or has been tampered with.
* **Error Responses:**
    * `403 Forbidden` if the authenticated user is not a vendor.
    * `400 Bad Request` if `transactions` is missing or empty.
    * `500 Internal Server Error` if the server's public key file is not found.


---

## System / Utilities

### Get Current Time
* **Endpoint:** `GET /api/time`
* **Requires Auth:** No
* **Success Response (200 OK):**
    ```json
    {
        "time": 1688661234.567
    }
    ```

### Test Database Connection
* **Endpoint:** `GET /api/test-db`
* **Requires Auth:** No
* **Success Response (200 OK):**
    ```json
    {
        "status": "success",
        "message": "Successfully connected to MongoDB Atlas!"
    }
    ```

### Run Test Cases
* **Endpoint:** `GET /api/test_cases`
* **Description:** Executes backend unit/integration tests to verify database connections and endpoint functionality.
* **Requires Auth:** No
* **Success Response:** Depends on the output of the internal `Tester` class.

---

## Status Code Legend
* `200 OK` - The request was successful and the server returned the expected data.
* `201 Created` - The request was successful and a new resource was created as a result.
* `400 Bad Request` - The server could not understand the request due to invalid syntax or missing required fields.
* `401 Unauthorized` - Authentication failed due to invalid credentials.
* `403 Forbidden` - The authenticated user does not have permission to access the requested resource.
* `404 Not Found` - The requested resource does not exist on the server.
* `500 Internal Server Error` - An unexpected error occurred on the server while processing the request.
