# GameHub Frontend

## Local development

Copy `.env.example` to `.env` before starting Expo. Set
`EXPO_PUBLIC_API_URL` to the backend's reachable HTTP address. Android emulators
default to `http://10.0.2.2:8080`; web and iOS default to
`http://localhost:8080`. For a physical device, use the development computer's
LAN address and allow that frontend origin in the backend's
`CORS_ALLOWED_ORIGINS`.

Run `npm start` to open the Expo development server.
