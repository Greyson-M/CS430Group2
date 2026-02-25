## How to run the project

- For setting up the frontend, please refer to [the Frontend README](Front/FrontSetup.md).
- For setting up the backend, please refer to [the Backend README](Back/BackSetup.md).

---

1. Once the frontend and backend are set up, you can run the backend first by navigating to the `Back/Api` directory and running `flask run`. Make sure that the venv is activate and that you have installed the dependencies.
2. Then, you can run the frontend by navigating to the `Front/front-app` directory and running `npm run dev`. This will start the Vite development server.
3. Open your browser and go to `http://localhost:5173` to see the frontend. You should see the current time displayed, which is fetched from the backend API. This demonstrates that the frontend and backend are successfully connected.