# AI Travel Planner Workspace (High-Fidelity Decoupled System)

Welcome to the **AI Travel Planner Workspace**, a modern, state-of-the-art production-grade web application designed for seamless, intelligent, and highly realistic travel itinerary creation. 

This ecosystem is fully decoupled into a **modern Next.js frontend SPA** and a **TypeScript Express backend REST API**, backed by a durable **MongoDB cluster** and powered by the cutting-edge **Google GenAI SDK**.

---

## 📖 Project Overview

Planning trips is traditionally a fragmented process involving hours of manual coordinate lookups, unrealistic transit timings, generic packing checklists, and untrustworthy budget estimates. 

The **AI Travel Planner** solves this by acting as an automated professional world-travel consultant. By feeding your precise travel constraints (such as origins, destinations, duration, budget levels, travel modes, and specific timings) into a customized state-control engine, the application synthesizes a complete travel plan that includes:
*   **Day-by-Day Hour-Based Itineraries:** Fully detailed activities mapped to realistic times.
*   **Grounded Hotel Recommendations:** Realistically-priced hotel suggestions organized by category and cost ranges.
*   **Smart Multi-Category Budgets:** Calculated using localized currencies matching your trip context.
*   **Contextual Packing Checklists:** Complete with an AI-generated personalized rationale for every single suggested item.

---

## 📅 High-Level Architecture Explanation

This workspace is designed with a professional, fully decoupled, microservices-oriented architecture separating concerns between the client browser, API server, persistent database, and AI endpoints.

```
                                      +------------------------------------+
                                      |         Client Application         |
                                      |      (Next.js App Router SPA)      |
                                      +-----------------+------------------+
                                                        |
                                            HTTP REST API Client (CORS)
                                                        |
                                                        v
                                      +-----------------+------------------+
                                      |         Backend Service            |
                                      |        (Express + Node.ts)         |
                                      +-----------------+------------------+
                                                        |
                                  +---------------------+---------------------+
                                  |                                           |
                                  v                                           v
                   +--------------+---------------+            +--------------+---------------+
                   |       Database Cluster       |            |        Google Gemini API     |
                   |      (MongoDB & Mongoose)    |            |   (Primary: 3.5-Flash /      |
                   +------------------------------+            |    Fallback: 3.1-Lite)       |
                                                               +------------------------------+
```

### Data & Architecture Flow

1.  **Request Initiation:** The user logs in via the Next.js client, enters trip criteria (e.g., Mumbai to London, 5 days, Train, Medium Budget), and submits.
2.  **API Validation & Guard:** The Express API receives the request, authorizes the stateless JWT signature, and passes the parsed specifications to the `AIService`.
3.  **Intelligent Generation & Fallback Loop:** 
    *   The `AIService` constructs a structured prompt paired with a strict JSON schema and attempts to contact Google's **Gemini 3.5 Flash** model.
    *   If the model experiences peak-hour transient spikes (errors such as `503 Service Unavailable` or `429 Too Many Requests`), our resilient **automatic fallback mechanism** intercepts the exception, logs it, and immediately downgrades the request to the highly-available **Gemini 3.1 Flash Lite** model while executing a staggered exponential backoff.
4.  **Enriched Database Persistence:** Once a valid JSON schema is returned, the backend recalculates overall totals for budget segments deterministically (ensuring flawless mathematical consistency), associates the trip with the user's `ObjectId`, and saves it directly to the MongoDB cluster.
5.  **Client Hydration:** The Next.js client receives the structured trip document, and maps it onto modular visual dashboards, accordion interfaces, and interactable checklist grids.

---

## 🛠️ Chosen Tech Stack & Justifications

To support a highly reliable, reactive, and professional experience, selected the following decoupled stack:

### 💻 Frontend Client Subsystem (`/travel-planner-ui`)
*   **Framework:** **Next.js 14+ (App Router)** configured as a Single Page Application (SPA). This gives us excellent developer ergonomics, modular component code-splitting, and extremely fast client-side routing.
*   **Styling:** **Tailwind CSS** with a carefully paired, eye-safe, high-contrast palette (off-whites, deep charcoals, and micro-accents) for a premium, clean layout.
*   **Animations:** **Framer Motion** (`motion/react`) for custom interactive transitions, accordion slides, and staggered list-entrances.
*   **Icons:** **Lucide React** for dynamic, high-quality, scalable SVG vector indicators (no bulky PNG assets).

### 🖥️ Backend API Subsystem (`/travel-planner-api` or root `/`)
*   **Runtime:** **Node.js with TypeScript**. TypeScript ensures compiled type safety and eliminates runtime errors across model entities and API payloads.
*   **Framework:** **Express.js**. Lightweight, highly modular, and extremely efficient for RESTful routing.
*   **Database Driver:** **Mongoose with MongoDB**. A document database matches the nested, flexible tree nature of complex multi-day travel itineraries perfectly, eliminating bulky relational joins.
*   **AI Engine:** **Google GenAI SDK (`@google/genai@2.4.0`)** utilizing native structured JSON schemas and robust retry loops.

---

## 🔐 Authentication & Authorization Approach

Implemented a stateless **JSON Web Token (JWT)** session model to secure sensitive resources:

```
[Client Sign Up]  ---> Validate inputs -> Bcrypt hash password (Salt: 10) -> Persist to MongoDB
[Client Sign In]  ---> Match Email -> Compare Bcrypt hashes -> Sign JWT (JWT_SECRET) -> Return Token
[Client Request]  ---> Inject Bearer Token in HTTP header ("Authorization: Bearer <JWT>")
[API Gatekeeper] ---> authMiddleware decodes JWT -> Appends req.user -> Calls protected route handlers
```

*   **Cryptographic Salting:** User passwords are never stored in plain text. Utilized `bcryptjs` with a cost factor of 10 to securely hash passwords prior to database insertion.
*   **Bearer Protection:** Every sensitive request (fetching user-specific dashboard metrics, creating trips, editing, or deleting itineraries) is blocked by a lightweight `authMiddleware` which decodes and validates the signature of incoming JWT payloads.
*   **Client Session Persistence:** The JWT is stored securely in the browser's `localStorage` and purged instantly when the user clicks **Sign Out**, ensuring robust, stateless session termination.

---

## 🤖 AI Agent Design & Purpose

The core intelligence of the application is encapsulated in a dedicated server-side `AIService`. Rather than operating as a simple text completion tool, the AI agent is engineered to act as a **Deterministic Structured Output Engine**:

1.  **Strict Schema Enforcement:** Complex, strongly-typed JSON Schema is directly fed into Gemini's configuration. This guarantees that the LLM's response always fits our predefined structures, preventing parsing crashes or incomplete responses.
2.  **Context Alignment & Prompt Guarding:** The prompt dynamically incorporates user styles, departure times, and specific interests, instructing the model to structure Day 1 and the final day to exactly respect the traveler's arrival and departure timings.
3.  **Resilient Fail-Safe Generation:** 
    *   **Fallback to Standard Generation:** When Google Search grounding is blocked, unavailable, or times out, the service catches the grounding error and falls back to standard LLM generation instantly to preserve service availability.
    *   **Transient Error Retry & Model Fallback:** When experiencing API rate limits, the `callGeminiWithRetry` wrapper executes up to 2 retry attempts with exponential backoff. If the primary model `gemini-3.5-flash` experiences temporary high-demand spikes, it automatically routes the request to `gemini-3.1-flash-lite`, ensuring the user never gets blocked during live presentations or demos.

---

## 🎨 Creative & Custom Features

### 1. 🚌 Intelligent Transit-Aware Routing System
Most travel tools generate itineraries that magically teleport users from one city to another without accounting for physical travel time. Our custom transit engine fixes this:
*   **Physical Realism:** When a user selects a transit mode (e.g., Plane, Train, Bus, or Car), the AI is instructed to inject logical, real-time travel slots directly into Day 1 or inter-city days.
*   **Schedule Adjustment:** If a user selects an **Overnight** train, the itinerary logically structures an evening departure slot, guides packing recommendations (e.g., neck pillows, earplugs), and sets up the next morning's itinerary around the arrival station.
*   **Logical Pacing:** Limits daily schedules to a maximum threshold of realistic hours to prevent planning "impossible days" with 18 hours of continuous sightseeing.

### 2. 🧳 Context-Aware Packing Assistant with Rationales
Instead of displaying a generic packing list, our packing assistant cross-references:
*   The actual day-by-day activities (e.g., temple visits require modest wear, beaches require sandals).
*   The weather context of the destination.
*   The chosen transit modes.
*   **Personalized Rationale:** The system generates a custom "Why to pack" rationale column in the UI, turning a boring checklist into a smart, interactive, educational travel preparation guide.

### 3. 💵 Smart Localized Currency & Budget Matrix
The system automatically maps trip origins/destinations to their correct geographic currency codes (e.g., trips involving India use **INR/₹**, USA uses **USD/$**, UK uses **GBP/£**, Europe uses **EUR/€**).
*   The AI outputs actual price metrics matching that specific currency.
*   The UI renders a gorgeous, structured budget matrix comparing estimated flight, accommodation, activity, and dining expenses.

---

## ⚙️ Environment Configuration

To operate correctly, both the client and server expect specific variables configuration.

### For API Service (`/travel-planner-api/.env` or root `.env`)
Create a `.env` file in the directory containing:
```env
PORT=3000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/travel-planner?retryWrites=true&w=majority
JWT_SECRET=your_jwt_signing_secret_key_string
GEMINI_API_KEY=your_google_gemini_api_key
```

### For UI Web Client (`/travel-planner-ui/.env.local`)
Create a `.env.local` file in the ui directory containing:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

---

## 🚀 Local Development Setup

To spin up both systems locally for testing:

### 1. Run MongoDB
Ensure you have a MongoDB instance running locally on standard port `27017` or have plugged in your cloud Atlas connection string into the `.env` configuration file.

### 2. Start API Backend Service
```bash
cd travel-planner-api
npm install
npm run dev
```
The server will boot up and bind to `http://localhost:3000` (or `http://localhost:5000` depending on port override).

### 3. Start Next.js App UI Client
```bash
cd travel-planner-ui
npm install
npm run dev
```
The modern UI workspace can be checked out in your browser at `http://localhost:3000`.

---

## 🛡️ Key Design Decisions & Trade-offs

*   **Decoupled SPA vs. Server-Side Rendering (SSR):** I chose to build the client as a high-fidelity Single Page Application (SPA). While SSR offers slight SEO benefits, travel planning dashboards are highly interactive, state-driven workspaces. A client-side React SPA powered by Next.js App Router provides instantaneous tab switches, smooth layout animations via Framer Motion, and zero page flickering, resulting in a much more polished user experience.
*   **No Schema-less AI Outputs:** I strictly decoupled the AI text synthesis from the database insertion. The AI must return a structure that fits our Mongoose model schemas perfectly. If a field fails schema validation, it is caught early and re-processed, maintaining absolute database integrity.
*   **Dual-Model Fail-Safe System:** Incorporating an automatic model downgrade pathway to `gemini-3.1-flash-lite` during high demand ensures that even during massive global usage spikes on Google's infrastructure, the application is always guaranteed to return a beautifully formatted, highly usable travel plan, prioritizing application uptime over the minor detail improvements of the 3.5 model.

---

## ⚠️ Known Limitations

1.  **Strict Global Rate Limits on Free Quota:** The Gemini API free tier carries a rate limit of 15 RPM (Requests Per Minute). To mitigate this, our application includes an automatic call wrapper that queues and retries requests, but massive simultaneous team-wide testing might occasionally trigger temporary rate delays.
2.  **Stateless Token Revocation:** Since stateless JWT sessions are used for performance and server scalability, tokens cannot be forcefully revoked server-side before their expiration limit (default 24 hours) unless a blocklist database is implemented. This risk is manged by using shorter token lifespans and thorough client-side local storage purification on log out.

---

### Developed with 🖤 for Globetrotters Worldwide. Have a great journey!
