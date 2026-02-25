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

## Important Note about dependencies

- If you include a new library in the backend, make sure to navigate to the `Back/` directory, activate the virtual environment, and run `pip freeze > requirements.txt` to update the `requirements.txt` file with the new dependency. This ensures that anyone else setting up the backend will have all the necessary dependencies installed. Make sure you do this before pushing, every time you add a new dependency.
- On the other hand, if you are pulling changes that include new dependencies, make sure to navigate to the `Back/` directory, activate the virtual environment, and run `pip install -r requirements.txt` to install any new dependencies that have been added by other team members.

## Troubleshooting

- If you encounter issues with the virtual environment, ensure that you have Python installed and that the `venv` module is available.
- If you have issues with missing packages, ensure that you have "activated" the virtual environment, your terminal should show `(venv)` at the beginning of the line. If not, activate it again.
- If you encounter issues with the Flask server not starting, check for any error messages in the terminal and ensure that you have the correct version of Flask installed.
- Ask a robot.
