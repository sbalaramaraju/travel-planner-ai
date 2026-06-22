# Travel Planner AI - Backend API Service

This is the independent, production-ready server API service powered by **Express**, **TypeScript**, and **Gemini 3.5**. It operates fully decoupled from any frontend.

## Features
- **User Authentication**: Secure JWT token registration, sign-in, and verification using bcrypt hash storage.
- **AI Engine (Gemini 3.5)**: Single-call robust itinerary generation with hotel recommendations and budget estimation.
- **Refinement Assistant**: Real-time itinerary modifications via natural language requests.
- **Local JSON DB File Engine**: Fast thread-safe cache reads/writes simulating a Document DB. Easy to plug any SQL/NoSQL driver (such as MongoDB or Postgres).

## Production Deployment to Render or Railway
To deploy the backend to production hostings:

1. **Deploy Repository**: Push the contents of this folder (`/travel-planner-api`) as a separate custom GitHub repository.
2. **Environment Configuration**: Set up these environment variables in your deployment dashboard:
   - `PORT`: Set to standard `4000` or `3000`.
   - `JWT_SECRET`: A rigorous, secure secret key of your choice.
   - `GEMINI_API_KEY`: Your official Google AI Studio Gemini API Key.
3. **Build & Start commands**:
   ```bash
   npm run build
   npm run start
   ```
