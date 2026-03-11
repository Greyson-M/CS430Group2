## How to run the project

- For setting up the frontend, please refer to [the Frontend README](Front/FrontSetup.md).
- For setting up the backend, please refer to [the Backend README](Back/BackSetup.md).
- For API documentation, please refer to [the API documentation](Back/Api/documentation.md).

---

## Back-Frontend Integration

### Currently Done:

- The frontend can successfully make API calls to the backend to enable <u>user creation</u> and <u>login/logout</u>. Needs more thorough testing, but the signup,sing in, and signout all seem functional.
- The frontend displays an <u>API and login status indicator</u> in the footer, which updates every 30s.
- The backend has an endpoint to <u>invalidate all tokens</u> for testing purposes, which can be used to verify that the frontend correctly detects expired tokens and updates the UI accordingly.

### What's next:

- Integrate the API calls for item management:
    - Create Item
    - View Items
    - Edit Item
    - Delete Item

- Integrate the API calls for user account management:
    - View Account Details
    - Edit Account Details

- Improve upon error handling and user feedback in the frontend, such as displaying error messages when API calls fail or when login credentials are incorrect.
