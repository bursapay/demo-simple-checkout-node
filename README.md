# Simple Checkout + Inline Popup (Node.js/Express)

Express server that initializes a payment server-side and launches the BursaPayInline popup
client-side for an in-page checkout experience. The server exposes a JSON endpoint that the
browser calls via JavaScript; the BursaPayInline script then opens a payment modal without
navigating away from the page.

---

## Prerequisites

- Node.js 18+
- npm

---

## Setup

```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Fill in your secret key
#    Open .env and set BURSAPAY_SECRET_KEY to your test key from the BursaPay dashboard

# 3. Install dependencies (SDK variant)
cd sdk
npm install

# — or — install dependencies (API variant)
cd api
npm install

# 4. Run the server
node server.js
# or
npm start
```

---

## API Endpoints Exercised

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/payments/initialize/` | Server-side: initialize payment and return `reference` |
| `POST` | `/api/v1/payments/verify/` | Server-side: verify payment after `onSuccess` callback fires |
| —      | BursaPayInline client-side popup | Client-side: `BursaPayInline.checkout({ publicKey, reference, onSuccess, onClose })` |

---

## Demo Routes

| Route | Description |
|-------|-------------|
| `GET /` | Product page with "Pay Now" button |
| `POST /api/checkout` | Initializes payment, returns `{ reference }` as JSON |
| `GET /callback` | Verifies payment reference and renders success or error page |

---

## Language / Framework

`node.js` · `express` · `bursapayinline`

---

## Testing Locally

Make sure the BursaPay Django dev server is running on port 8000 before starting the demo.

```bash
# Set environment variables
export BURSAPAY_BASE_URL=https://api.bursapay.com/api/v1
export BURSAPAY_SECRET_KEY=sk_test_your_key_here

# Run the server
node server.js
```

Then open **http://localhost:3000** in your browser.

1. Click **Pay Now** on the product page.
2. The browser calls `POST /api/checkout`, which initializes the payment server-side.
3. BursaPayInline opens a payment modal on the current page.
4. Complete the payment in the modal.
5. The `onSuccess` callback fires; the server verifies the reference and renders a success page.

To verify the raw API variant independently, run `node server.js` inside the `api/` folder
instead.
