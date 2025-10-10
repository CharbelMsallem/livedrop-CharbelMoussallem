# Component & Scaffolding Prompts Log

This document serves as a log of the key prompts given to an AI assistant to scaffold, build, and refine the Shoplite Storefront application.

---

### 1. Project Initialization & Core Architecture

* **Prompt:**
    * **Role:** You are a senior software architect responsible for setting up a new, modern frontend project.
    * **Goal:** Provide the shell commands to initialize a React project using Vite and TypeScript. Then, generate the configuration files to fully integrate Tailwind CSS. Finally, scaffold the four core library files required for the application's architecture.
    * **Constraints:** The project must use `pnpm` as the package manager. The library files must be created at `src/lib/` with the following specifications:
        1.  `api.ts`: Must contain mock function signatures for `listProducts`, `getProduct`, `getOrderStatus`, and `placeOrder`.
        2.  `router.tsx`: Must be a simple client-side router built with React Context, not a heavy library.
        3.  `store.ts`: Must use Zustand for global state management and be configured to handle a cart of `CartItem[]`.
        4.  `format.ts`: Must be a simple utility file containing a function to format numbers into USD currency.

* **Result:** The AI provided the necessary shell commands for initialization and generated the four requested library files with the correct function signatures and type definitions, establishing the application's foundational architecture.

---

### 2. Scaffolding the Component Atoms

* **Prompt:** "Create a reusable `Button` component in `src/components/atoms/Button.tsx`. It needs to be highly flexible, supporting `primary`, `secondary`, `outline`, and `danger` visual variants, as well as `sm`, `md`, and `lg` sizes. The component must accept all standard HTML button attributes, including `onClick` and `disabled` states. Use Tailwind CSS for all styling."
* **Result:** The AI generated a fully functional `Button.tsx` file with props for `variant` and `size`, along with the corresponding class names.

* **Prompt:** "Generate a reusable `Input` component at `src/components/atoms/Input.tsx`. It must include a `<label>` and an optional error message `<span>`. For accessibility, the `<label>` and `<input>` must be correctly linked using the `htmlFor` attribute and a unique `id`."
* **Result:** The AI produced an accessible `Input.tsx` component that correctly used the `useId` hook to link the label and input.

---

### 3. Assembling the Molecules

* **Prompt:** "Build a `ProductCard` molecule in `src/components/molecules/ProductCard.tsx`. This component will be the primary element in our product grid. It should display a product's image, title, price, and its first two tags. A 'Quick Add' button should be visually hidden by default but appear with a smooth transition when the user hovers over the card. This button's click handler should call the `addItem` function from our Zustand store."
* **Result:** The AI generated `src/components/molecules/ProductCard.tsx`, which correctly imported and used the `Button` and `Badge` atom components and implemented the required hover effect using Tailwind's `group-hover` utilities.

---

### 4. Building the Main Organisms

* **Prompt:** "Generate the main site `Header` organism at `src/components/organisms/Header.tsx`. It should be a sticky header with a glassmorphism effect. On the left, it should display the Shoplite logo and brand name. On the right, it needs a navigation section containing a 'Support' button and a cart icon. The cart icon must display a badge with the live item count from the Zustand store."
* **Result:** The AI created `src/components/organisms/Header.tsx`, which correctly subscribed to the `useCartStore` hook to display a real-time count of items in the cart.

---

### 5. Constructing the Application Pages

* **Prompt:**
    * **Role:** You are a full-stack developer tasked with building the main user-facing pages of an e-commerce application.
    * **Goal:** Scaffold the `CheckoutPage` in `src/pages/checkout.tsx`. The page must include a form for shipping information (name, email, address) and a dynamic order summary section that displays the subtotal, tax, and total cost based on the items in the cart.
    * **Constraints:** The form must use our existing `Input` and `Button` components. It needs client-side validation to ensure no fields are empty before submission. The "Place Order" button must call the `placeOrder` function from `api.ts`. Upon a successful order, the application must redirect the user to the order status page using the `Maps` function from our router, passing the new order ID in the URL.

* **Result:** The AI scaffolded `src/pages/checkout.tsx` with robust form validation, state handling for form inputs, and the correct navigation logic for a seamless user checkout experience.

---

### 6. Finalizing with Tests and Documentation

* **Prompt:**
    * **Role:** You are a QA engineer and technical writer responsible for ensuring the project has high code quality and excellent developer documentation.
    * **Goal:** Generate a complete test and documentation suite for the project. For every single component in the `atoms`, `molecules`, and `organisms` directories, create two corresponding files:
        1.  A Vitest unit test file (`.test.tsx`) that validates the component's rendering logic, props, and user interactions (e.g., button clicks).
        2.  A Storybook stories file (`.stories.tsx`) that documents the component's different visual states and variants (e.g., a `Button` in its `primary` vs. `danger` state, or a `ProductCard` with low stock).
    * **Constraints:** All tests must use `@testing-library/react` for querying the DOM. For components with external dependencies like `useCartStore` or `useRouter`, the tests must include the necessary mocks (`vi.mock`) to ensure the components can be tested in complete isolation.

* **Result:** The AI generated all corresponding `.test.tsx` and `.stories.tsx` files for each component, which significantly accelerated the process of achieving full test coverage and creating a comprehensive, interactive component library in Storybook.