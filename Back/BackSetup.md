# Backend

## Setting up the venvironment

1. Navigate to the `Back/` directory in your terminal.
2. Create a virtual environment using the command:

   ```bash
   python -m venv venv
   ```

    This will create a virtual environment named `venv` in the `Back/` directory. This may take a minute to complete.

3. Activate the virtual environment:
    - On Windows:

      ```bash
      venv\Scripts\activate
      ``` 
    - On macOS/Linux:
      ```bash
      source venv/bin/activate
      ```
4. Install the required dependencies using pip (this also may take a minute):

    ```bash
    pip install -r requirements.txt
    ```

5. Navigate to the `Api/` directory:

    ```bash
    cd Api
    ```
6. Create a `.env` file in the `Api/` directory with the following content:

    ```bash
    FLASK_APP = api.py
    FLASK_ENV = development
    ```
7. Run the Flask application:
    ```bash
    flask run --no-debugger
    ```
    The backend server should now be running at `http://localhost:5000`. You can test the API endpoints with a curl command or by visiting `http://localhost:5000/api/time` in your browser to see the current time returned by the API.

## Mongo Atlas Setup

0. Check out the BackendTest branch for most recent test code and run `pip install -r requirements.txt` to install the new libraries. You need the venv active.
1. Create a MongoDB Atlas account
2. Navigate to the "Database" section click "cluster0" and then click "Connect"
![Mongo Atlas Connect](/Back/instructions/connect_new.png)
3. Choose "Connect your application"
4. Copy the connection string
![Mongo Atlas Connection String](/Back/instructions/copy_uri.png)
5. Replace the `MONGO_URI` value in the `.env` file with the connection string, making sure to replace `<password>` with your actual password for the MongoDB user, and add app after the final slash.
![Mongo Atlas Update .env](/Back/instructions/update_uri.png)
6. Restart the Flask server to apply the changes.
7. Try navigating to `http://localhost:5000/api/test-db` to test the database connection. You should see a message indicating whether the connection was successful or if there was an error.

## Important Note about dependencies

- If you include a new library in the backend, make sure to navigate to the `Back/` directory, activate the virtual environment, and run `pip freeze > requirements.txt` to update the `requirements.txt` file with the new dependency. This ensures that anyone else setting up the backend will have all the necessary dependencies installed. Make sure you do this before pushing, every time you add a new dependency.
- On the other hand, if you are pulling changes that include new dependencies, make sure to navigate to the `Back/` directory, activate the virtual environment, and run `pip install -r requirements.txt` to install any new dependencies that have been added by other team members.

## Troubleshooting

- If you encounter issues with the virtual environment, ensure that you have Python installed and that the `venv` module is available.
- If you have issues with missing packages, ensure that you have "activated" the virtual environment, your terminal should show `(venv)` at the beginning of the line. If not, activate it again.
- If you encounter issues with the Flask server not starting, check for any error messages in the terminal and ensure that you have the correct version of Flask installed.
- Ask a robot.
