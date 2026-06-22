# Travel Planner AI - Frontend UI Client

This is the independent, production-ready frontend web application powered by **React**, **Vite**, **TypeScript**, and styled with **Tailwind CSS**. It is fully decoupled from the backend.

## Features
- **Intuitive UI & Custom Theme**: Standard gorgeous slate/indigo colors, responsive forms, collapsible sidebars, and full list managers.
- **Accordion Itineraries**: Tap days to expand detailed descriptions and calculated USD cost ranges.
- **Interactive Chat Interface**: Bottom dock refinement box allowing natural language edits to change the trip instantly.
- **Auth Guard**: Direct JWT storage and persistence using local session cache checks.

## Production Deployment to Vercel or Netlify
To deploy the frontend to a pure static server:

1. **Deploy Repository**: Push the contents of this folder (`/travel-planner-ui`) as a separate custom GitHub repository.
2. **Environment Configuration**: Define the backend API environment variable:
   - `VITE_API_URL`: Set this to your live backend base API URL (e.g. `https://your-api-domain.render.com`). If left blank, it falls back to relative paths (`/api`) under its own server reverse proxy.
3. **Build Command**:
   ```bash
   npm run build
   ```
4. **Publish Directory**:
   - `dist`
