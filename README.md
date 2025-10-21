# Shoplite MVP - Week 5

This project is the final Minimum Viable Product (MVP) for Week 5, connecting a React storefront to a backend API with a MongoDB database, real-time order tracking via Server-Sent Events (SSE), and an intelligent support assistant.

**Live Deployments:**

* **Frontend (Vercel):** [https://livedrop-charbel-moussallem.vercel.app](https://livedrop-charbel-moussallem.vercel.app)
* **Backend API (Render):** [https://livedrop-api.onrender.com](https://livedrop-api.onrender.com)

## Project Overview

This application includes:

* A **Storefront** (`apps/storefront`) built with React, Vite, TypeScript, and Tailwind CSS.
* A **Backend API** (`apps/api`) built with Node.js, Express, and MongoDB.
* **Real-time order tracking** using Server-Sent Events (SSE).
* An **Intelligent Support Assistant** featuring intent detection, function calling, and grounding using a knowledge base.
* An **Admin Dashboard** for monitoring business metrics, performance, and assistant analytics.

## Demo User for Testing

As required by the assignment, you can test the application using the pre-seeded demo user:

* **Email:** `demo@example.com`

**How to log in:** Simply enter this email on the login screen. No password is required for this demonstration.

**Demo User's Seeded Orders:**

This user has been seeded with the following order history for testing purposes. **Note:** As these are seeded orders, their statuses will **not** change automatically via SSE when viewed.

1.  **Order (Processing):**
    * **Items:** Curved Gaming Monitor (Quantity: 1)
    * **Total:** $1199.99
    * **Status:** PROCESSING
2.  **Order (Shipped):**
    * **Items:** Digital SLR Camera Kit (Quantity: 1), Portable Power Bank (20,000mAh) (Quantity: 2)
    * **Total:** $409.93
    * **Status:** SHIPPED
    * **Carrier:** FedEx
3.  **Order (Delivered):**
    * **Items:** Scented Soy Candle (Quantity: 1)
    * **Total:** $29.95
    * **Status:** DELIVERED

*Note: The exact order details (`_id`, `total` calculated with tax/shipping) may vary slightly based on final seed data. To see the **real-time SSE status updates**, please place a **new order** through the storefront. The automated status progression from PENDING to DELIVERED takes approximately 15-20 seconds.*

## Image Storage

Product images are currently linked directly from a stock image website (e.g., Unsplash). Blob storage (like AWS S3) was not implemented for this MVP due to the small number of products (30 images).

## Setup and Running Locally

Please refer to the `docs/deployment-guide.md` for detailed instructions on setting up the database, backend, frontend, and LLM endpoint for local development or deployment.

## Testing

To run the automated tests (API, Assistant, Integration), navigate to the root directory and use the scripts defined in `package.json`:

```bash
# Run all tests serially
pnpm test -- --runInBand

# Run specific suites
pnpm run test:api
pnpm run test:assistant
pnpm run test:integration