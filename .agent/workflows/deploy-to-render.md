---
description: How to deploy the GitHub Portfolio Analyzer to Render
---

# Deploying to Render

This project consists of two parts: a **Backend (Node.js)** and a **Frontend (Vite/React)**. You will need to create two separate services on Render.

## 1. Deploy the Backend (Web Service)

1.  **Create New Service**: Select **Web Service**.
2.  **Connect Repo**: Choose your GitHub repository.
3.  **Root Directory**: Set to `backend`.
4.  **Runtime**: Set to `Node`.
5.  **Build Command**: `npm install`
6.  **Start Command**: `node server.js`
7.  **Environment Variables**:
    *   `GOOGLE_API_KEY`: Your Gemini/OpenAI API key.
    *   `GITHUB_TOKEN`: Your GitHub personal access token (recommended to avoid rate limits).
    *   `PORT`: `5000` (Render will usually provide this automatically).
8.  **Wait for Deployment**: Once live, copy your backend URL (e.g., `https://your-backend.onrender.com`).

> [!WARNING]
> SQLite database persistence is limited on Render's Free tier. For permanent history, consider using a Render PostgreSQL database and updating `database.js`.

## 2. Deploy the Frontend (Static Site)

1.  **Create New Service**: Select **Static Site**.
2.  **Connect Repo**: Choose the same repository.
3.  **Root Directory**: Set to `frontend`.
4.  **Build Command**: `npm install && npm run build`
5.  **Publish Directory**: `dist`
6.  **Environment Variables**:
    *   `VITE_API_URL`: Paste your **Backend URL** from step 1 (include `https://`).

## 3. Important: Code Update

Ensure your frontend code uses the environment variable for API calls.

```javascript
// Example in App.jsx
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
// Use API_BASE_URL in your fetch calls
```

Your app will now be live on the Render static site URL!
