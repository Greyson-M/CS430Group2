# Backend

## Setting up the venvironment
1. Navigate to the `Back/` directory in your terminal.
2. Create a virtual environment using the command:
   ```
   python -m venv venv
   ```
    This will create a virtual environment named `venv` in the `Back/` directory. This may take a minute to complete.

3. Activate the virtual environment:
    - On Windows:
      ```
      venv\Scripts\activate
      ```
    - On macOS/Linux:
      ```
      source venv/bin/activate
      ```
4. Install the required dependencies using pip (this also may take a minute):
    ```
    pip install -r requirements.txt
    ```
5. Navigate to the `Api/` directory:
    ```
    cd Api
    ```
6. Create a `.env` file in the `Api/` directory with the following content:
    ```
    FLASK_APP = api.py
    FLASK_ENV = development
    ```
7. Run the Flask application:
    ```
    flask run --no-debugger
    ```
    The backend server should now be running at `http://localhost:5000`. You can test the API endpoints with a curl command or by visiting `http://localhost:5000/api/time` in your browser to see the current time returned by the API.

## Troubleshooting
- If you encounter issues with the virtual environment, ensure that you have Python installed and that the `venv` module is available.
- If you have issues with missing packages, ensure that you have "activated" the virtual environment, your terminal should show `(venv)` at the beginning of the line. If not, activate it again.
- If you encounter issues with the Flask server not starting, check for any error messages in the terminal and ensure that you have the correct version of Flask installed.
- Ask a robot