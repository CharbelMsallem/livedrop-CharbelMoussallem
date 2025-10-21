# Deployment Guide

This guide outlines the steps to deploy the Shoplite application components: Database, Backend API, Frontend Storefront, and the LLM endpoint.

---

## 1. Database Setup (MongoDB Atlas)

**Goal:** Set up a free-tier MongoDB Atlas cluster to store application data.

**Steps:**

1.  **Create Account:** Sign up for a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register). No credit card is required.
2.  **Create Cluster:** Create a new **M0 tier cluster** (free tier provides 512MB storage). Choose a cloud provider and region.
3.  **Configure Network Access:**
    * Navigate to "Network Access" under the "Security" section.
    * Click "Add IP Address".
    * Select "Allow Access From Anywhere" (IP address `0.0.0.0/0`) or add your specific IP if preferred.
4.  **Create Database User:**
    * Navigate to "Database Access" under the "Security" section.
    * Click "Add New Database User".
    * Choose "Password" authentication.
    * Create a username and a strong password. **Save these credentials securely.**
    * Grant the user appropriate privileges (e.g., "Read and write to any database").
5.  **Get Connection String:**
    * Navigate back to your cluster "Overview".
    * Click "Connect".
    * Choose "Drivers".
    * Select your driver version (Node.js).
    * Copy the **connection string (URI)** provided. Replace `<password>` with the database user password you created.
6.  **Store Connection String:**
    * Add the complete connection string to your backend's `.env` file as `MONGO_URI`. **Do not commit the `.env` file to git.** Use `.env.example` as a template.

---

## 2. Backend API Deployment (Render.com or Railway.app)

**Goal:** Deploy the Node.js Express API server to a free hosting provider.

**Steps (Using Render.com as example):**

1.  **Sign Up/Login:** Create a free account or log in to [Render.com](https://render.com/).
2.  **Create New Service:** Click "New +" and select "Web Service".
3.  **Connect Repository:** Connect your GitHub/GitLab account and select the repository containing your `/apps/api` code.
4.  **Configure Service:**
    * **Name:** Give your service a name (e.g., `shoplite-api`).
    * **Region:** Choose a region.
    * **Branch:** Select the branch to deploy from (e.g., `main`).
    * **Root Directory:** Specify `apps/api` (if your API code is in that subfolder).
    * **Build Command:** Typically `pnpm install` or `npm install`. Render often detects Node.js projects automatically.
    * **Start Command:** `node src/server.js` (or your API's entry point script).
    * **Environment:** Select "Node".
5.  **Add Environment Variables:**
    * Go to the "Environment" section for your service.
    * Add the following variables:
        * `MONGO_URI`: Paste your MongoDB Atlas connection string.
        * `PORT`: Render provides this automatically, but if needed, set it (e.g., `3000`).
        * `LLM_GENERATE_URL`: **Important:** You will add this *after* setting up the LLM endpoint via ngrok. It will be the public ngrok URL followed by `/generate`.
6.  **Select Plan:** Choose the **Free tier**.
7.  **Deploy:** Click "Create Web Service". Render will build and deploy your API. Note the public URL provided by Render.

*(Steps for Railway.app are similar: connect repo, configure build/start commands, add environment variables.)*

---

## 3. Frontend Storefront Deployment (Vercel)

**Goal:** Deploy the React frontend application to Vercel's free tier.

**Steps:**

1.  **Sign Up/Login:** Create a free account or log in to [Vercel](https://vercel.com/).
2.  **Import Project:**
    * Click "Add New..." -> "Project".
    * Connect your Git provider (GitHub/GitLab/Bitbucket) and select the repository containing your `/apps/storefront` code.
3.  **Configure Project:**
    * **Framework Preset:** Vercel should automatically detect "Vite".
    * **Root Directory:** Specify `apps/storefront` (if your storefront code is in that subfolder).
    * **Build and Output Settings:** Usually, Vercel detects Vite settings correctly. The default build command is often `npm run build` or `vite build`. The output directory is typically `dist`.
4.  **Environment Variables:**
    * Add an environment variable for your API's public URL:
        * **Name:** `VITE_API_BASE_URL` (or similar, ensure your frontend code uses this variable).
        * **Value:** Paste the public URL provided by Render/Railway for your backend API.
5.  **Deploy:** Click "Deploy". Vercel will build and deploy your storefront. Note the public URL provided by Vercel.

---

## 4. LLM Endpoint Setup (Google Colab + ngrok)

**Goal:** Expose your Week 3 Colab notebook's LLM via ngrok, adding a simple `/generate` endpoint for Week 5.

**Steps:**

1.  **Open Colab Notebook:** Open your Week 3 Google Colab notebook containing the LLM setup.
2.  **Add `/generate` Endpoint:**
    * Locate the Flask app setup in your notebook.
    * Add the following new route **without modifying your existing RAG `/chat` endpoint**:
3.  **Run Colab Cells:** Execute all cells in your Colab notebook, including installing dependencies, loading the model, setting up Flask, and starting the ngrok tunnel.
4.  **Get ngrok URL:** Copy the public URL provided by ngrok when the tunnel starts (it usually ends with `.ngrok-free.dev` or similar).
5.  **Update Backend Environment Variable:**
    * Go back to your Render/Railway backend service settings.
    * Update (or add) the `LLM_GENERATE_URL` environment variable. Set its value to the ngrok public URL followed by `/generate` (e.g., `https://your-ngrok-subdomain.ngrok-free.dev/generate`).
    * **Redeploy your backend** if necessary for the environment variable change to take effect.

**Important:** The Colab notebook and ngrok tunnel must remain running for the LLM endpoint to be accessible by your backend API.

---

## 5. Local Development Setup

To run the entire stack locally:

1.  **Install All Dependencies (Root):**
    * Navigate to the project's **root directory**.
    * Run `pnpm install`. This will install dependencies for the root project and all workspaces (`api`, `storefront`). 
    (OR PNPM INSTALL IN EACH FOLDER, ROOT THEN API THEN STOREFRONT)

2.  **Database:**
    * Ensure MongoDB is running locally or use your Atlas connection string.

3.  **Backend API:**
    * Navigate to `/apps/api`.
    * Create a `.env` file from `.env.example`.
    * Fill in `MONGO_URI`, `PORT` (e.g., 3000), and `LLM_GENERATE_URL` (your running ngrok URL).
    * Run `pnpm start` (or `npm start`).

4.  **Frontend Storefront:**
    * Navigate to `/apps/storefront`.
    * Create a `.env` file.
    * Add `VITE_API_BASE_URL=http://localhost:3000` (or the port your API is running on. When deployed, add the render URL). 
    * Run `pnpm dev`. Access via `http://localhost:5173` (or the port shown).

5.  **LLM:**
    * Ensure your Colab notebook is running with the ngrok tunnel active.

---

## 6. Running Tests (Jest)

All commands should be run from the **root directory**.

* **Run All Tests (Serially):**
    * To run all tests one after another (recommended to avoid conflicts) in root directory:
    ```bash
    pnpm test -- --runInBand
    ```
    *(Note: The extra `--` passes the `--runInBand` flag to Jest, not pnpm)*

* **Run Specific Test Suites (Individually):**
    * As defined in your `package.json`, you can run each test file separately:

    ```bash
    # Run only API endpoint tests
    pnpm run test:api

    # Run only Assistant tests
    pnpm run test:assistant

    # Run only Integration tests
    pnpm run test:integration
    ```

* **Run in Watch Mode:**
    * To run tests interactively as you make changes (will run on file save):
    ```bash
    pnpm run test:watch
    ```