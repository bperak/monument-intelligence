# Monument Intelligence

A map-based conversational assistant using NextJS and the Vercel AI SDK.

## Features

- Interactive map display using MapLibre GL
- Conversational AI assistant with location awareness
- Real-time streaming responses
- Environment configuration for backend API connections

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- Backend API server running (see configuration)

### Installation

1. Clone the repository
2. Install dependencies
   ```
   npm install
   # or
   pnpm install
   ```
3. Copy `.env.local.example` to `.env.local` and configure your environment variables
4. Start the development server
   ```
   npm run dev
   # or
   pnpm dev
   ```

## Environment Configuration

The application requires the following environment variables:

- `AGENT_BACKEND_URL`: URL to your backend API server (default: http://localhost:8000)
- `AGENT_API_KEY`: API key for authorization with the backend (if required)

## Development Notes

### API Response Format

The backend API is expected to return responses in a specific format with custom action types:

- `TextResponseAction`: For text-only responses
  ```json
  {"response":{"type":"text_response","content":"Hello! How can I assist you today?"}}
  ```

- `MapFocusAction`: For map-based interactions
  ```json
  {"response":{"type":"map_focus","data":{"location_name":"Paris","latitude":48.8534951,"longitude":2.3483915,"zoom":12},"text_response":"Okay, let's look at Paris on the map."}}
  ```

These responses are transformed to be compatible with the Vercel AI SDK's StreamingTextResponse format.