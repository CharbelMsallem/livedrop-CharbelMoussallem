# Shoplite Storefront (v1)

This is the official repository for the Shoplite Storefront, a minimal and fast UI built with React, Vite, and Tailwind CSS.

## Features

* **Product Catalog:** Browse, search, and filter products.
* **Product Details Page:** View detailed information and related items.
* **Shopping Cart:** Persistent cart with quantity management.
* **Mock Checkout & Order Status:** A complete, mocked user journey from checkout to order tracking.
* **AI-Powered Support:** An "Ask Support" panel to answer questions about orders and policies.

---

## 🚀 Getting Started

Follow these instructions to get a local copy up and running.

### Prerequisites

Make sure you have the following installed on your system:

* **Node.js** (v18 or later recommended)
* **pnpm** (You can install it by running `npm install -g pnpm`)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd storefront
    ```

2.  **Install dependencies:**
    This command will download and install all the necessary packages for the project.
    ```bash
    pnpm install
    ```

---

## Available Scripts

### `pnpm dev`

Runs the app in development mode. Open [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal) to view it in your browser. The page will reload when you make changes.

### `pnpm test`

Launches the test runner in the interactive watch mode. This will run all the unit tests for the components to ensure everything is working as expected.

### `pnpm build`

Builds the app for production to the `dist` folder. It correctly bundles React in production mode and optimizes the build for the best performance.

### `pnpm storybook`

Runs the Storybook server, allowing you to view and interact with all the UI components in isolation. This is great for development and documentation. It will open on a separate port (usually `6006`).