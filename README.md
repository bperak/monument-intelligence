# Monument Intelligence Platform

A modular, test-driven platform for heritage-mapping. This platform crowd-sources monument data, enriches it via multiple data sources, stores information in Supabase/Postgres with vector embeddings, and provides a conversational map-based interface powered by an LLM agent.

## 🌟 Features

- **Interactive Map**: MapLibre GL JS with Supabase vector tiles displaying monument data
- **Conversational Agent**: AI assistant with location awareness and map manipulation capabilities
- **Structured Responses**: Custom action types like `TextResponseAction` and `MapFocusAction`
- **Real-time Streaming**: Server-Sent Events (SSE) with the Vercel AI SDK
- **LLM Provider Flexibility**: Support for OpenAI, Google Gemini, or local Ollama models
- **MCP Enrichment**: Wikipedia summaries, YouTube captions, and other Model Context Protocol servers
- **Vector Search**: pgvector-powered similarity search for monuments
- **Photo Workflow**: Upload → EXIF parse → auto-marker placement

## 🏛️ Architecture

The platform follows a modular architecture with these key components:

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│    Frontend     │   │     Backend     │   │      LLMs       │
├─────────────────┤   ├─────────────────┤   ├─────────────────┤
│ - MapLibre GL   │   │ - Supabase DB   │   │ - OpenAI API    │
│ - Chat UI Panel │◄──┼─► - LightRAG    │◄──┼─► - Google      │
│ - Admin Console │   │ - Agent Layer   │   │ - Ollama Local  │
│                 │   │ - MCP Servers   │   │                 │
└─────────────────┘   └─────────────────┘   └─────────────────┘
```

## 🚀 Current Development Status

- **Stage 0-4**: ✅ Complete - Core storage, Enrichment pipeline, LightRAG integration, and Agent layer
- **Stage 5**: 🚧 In Progress - Map & Chat frontend (80% complete)
  - MapLibre integration ✅
  - Chat streaming ✅
  - API response handling ✅
  - Photo upload workflow 🚧
- **Stage 6-10**: 📝 Planned - Admin console, MCP expansion, CI/CD, QA and future features

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- Python 3.11+ (for backend services)
- FastAPI agent backend service running

### Installation

1. Clone the repository
   ```
   git clone https://github.com/bperak/monument-intelligence.git
   cd monument-intelligence
   ```

2. Install dependencies
   ```
   npm install
   # or
   pnpm install
   ```

3. Copy `.env.local.example` to `.env.local` and configure your environment variables
   ```
   # Backend API connection
   AGENT_BACKEND_URL=http://localhost:8000
   AGENT_API_KEY=dev-key
   
   # Optional MapLibre configuration
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_TILE_FUNCTION="/storage/v1/vector-tiles/{z}/{x}/{y}.pbf"
   ```

4. Start the development server
   ```
   npm run dev
   # or
   pnpm dev
   ```

## 🔄 API Response Format

The backend agent API returns responses in a specific format with custom action types:

### TextResponseAction

For regular text responses without map interaction:

```json
{
  "response": {
    "type": "text_response",
    "content": "Hello! How can I assist you today?"
  }
}
```

### MapFocusAction

For location-based responses that should update the map view:

```json
{
  "response": {
    "type": "map_focus",
    "data": {
      "location_name": "Paris",
      "latitude": 48.8534951,
      "longitude": 2.3483915,
      "zoom": 12
    },
    "text_response": "Okay, let's look at Paris on the map."
  }
}
```

The API route automatically transforms these custom formats to be compatible with the Vercel AI SDK's StreamingTextResponse.

## 📊 System Metrics & KPIs

| Metric               | Target      | Status      |
| -------------------- | ----------- | ----------- |
| Chat latency         | < 5 s (p95) | 🚧 Testing  |
| Map TTI              | < 1.5 s LTE | ✅ Achieved |
| Vector recall@10     | > 0.85      | ✅ Achieved |
| Agent tool accuracy  | > 90 %      | ✅ Achieved |
| Provider switch      | Seamless    | ✅ Achieved |
| Ingestion error rate | < 1 %       | 🚧 Testing  |

## 🔮 Future Roadmap

- **Admin Dashboard**: Streamlit + geemap with real-time updates
- **AR Mode**: Expo + MapLibre Native integration
- **3D Visualizations**: OpenSfM to deck.gl ScenegraphLayer
- **Multilingual Support**: UI translations and cross-language embeddings
- **CI/CD Pipeline**: GitHub Actions with automated deployment

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.