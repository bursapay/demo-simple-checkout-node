/**
 * BursaPay Simple Checkout Demo — SDK Variant (Node.js/Express)
 * ==============================================================
 * Uses the official `bursapay-sdk` npm package.
 *
 * Usage:
 *   cp ../.env.example .env   # fill in your keys
 *   npm install
 *   npm start                 # or: node server.js
 */

'use strict';

const dotenv = require('dotenv');

// Load .env before anything else so env vars are available for the startup guard
dotenv.config();

// ── Startup guard ────────────────────────────────────────────────────────────
const _missing = [];
if (!process.env.BURSAPAY_SECRET_KEY) _missing.push('BURSAPAY_SECRET_KEY');
if (!process.env.BURSAPAY_BASE_URL)   _missing.push('BURSAPAY_BASE_URL');

if (_missing.length > 0) {
  for (const v of _missing) {
    console.error(`[BursaPay] ERROR: Required environment variable '${v}' is not set.`);
  }
  process.exit(1);
}

// ── SDK init ─────────────────────────────────────────────────────────────────
const { BursaPay } = require('bursapay-sdk');

const bp = new BursaPay(process.env.BURSAPAY_SECRET_KEY, {
  baseUrl: process.env.BURSAPAY_BASE_URL,
});

// ── Express setup ────────────────────────────────────────────────────────────
const express = require('express');
const app = express();
app.use(express.json());

// ── Demo product ─────────────────────────────────────────────────────────────
const PRODUCT = {
  name:        'BursaPay Developer Tee',
  price:       5000,
  currency:    'NGN',
  description: 'A limited-edition t-shirt for BursaPay developers. Comfortable, minimal, and built to ship.',
  email:       'demo@example.com',
};

// ── Public key (may be absent in development) ─────────────────────────────────
const PUBLIC_KEY = process.env.BURSAPAY_PUBLIC_KEY || '';

// ── HTML helpers ─────────────────────────────────────────────────────────────
const BASE_STYLE = `
  *, *::before, *::after { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #f5f7fa; color: #1a202c; margin: 0; padding: 2rem;
  }
  .card {
    background: #fff; border-radius: 12px; padding: 2rem;
    max-width: 480px; margin: 2rem auto;
    box-shadow: 0 2px 12px rgba(0,0,0,.08);
  }
  h1 { font-size: 1.5rem; margin-bottom: 1.25rem; }
  .price { font-size: 2rem; font-weight: 700; color: #4f46e5; margin-bottom: .5rem; }
  .description { color: #718096; font-size: .95rem; margin-bottom: 1.5rem; line-height: 1.6; }
  button {
    width: 100%; padding: .75rem; border: none; border-radius: 8px;
    background: #4f46e5; color: #fff; font-size: 1rem; font-weight: 600;
    cursor: pointer; transition: background .15s;
  }
  button:hover { background: #4338ca; }
  button:disabled { background: #a5b4fc; cursor: not-allowed; }
  .badge { display: inline-block; padding: .25rem .7rem; border-radius: 9999px; font-size: .8rem; font-weight: 700; }
  .badge-success { background: #d1fae5; color: #065f46; }
  .badge-error   { background: #fee2e2; color: #991b1b; }
  .detail-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: .55rem 0; border-bottom: 1px solid #f0f0f0; font-size: .9rem;
  }
  .detail-row:last-child { border-bottom: none; }
  .back-link { display: block; text-align: center; margin-top: 1.25rem; color: #4f46e5; text-decoration: none; font-size: .875rem; }
  .back-link:hover { text-decoration: underline; }
  .error-box {
    background: #fff5f5; border: 1px solid #feb2b2; border-radius: 8px;
    padding: 1rem; color: #c53030; margin-top: 1rem; font-size: .9rem;
    display: none;
  }
  .error-box.visible { display: block; }
  .divider { border: none; border-top: 1px solid #e2e8f0; margin: 1rem 0; }
`;

function basePage(title, bodyContent) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>${BASE_STYLE}</style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
}

// ── Route: GET / — product page ───────────────────────────────────────────────
app.get('/', (req, res) => {
  const html = basePage('BursaPay Demo — Simple Checkout', `
  <script src="https://js.bursapay.com/v1/inline.js"></script>

  <div class="card">
    <h1>🛒 ${PRODUCT.name}</h1>
    <div class="price">₦${PRODUCT.price.toLocaleString('en-NG')}</div>
    <p class="description">${PRODUCT.description}</p>
    <hr class="divider">
    <button id="pay-btn" onclick="startCheckout()">Pay Now</button>
    <div class="error-box" id="error-box"></div>
  </div>

  <script>
    const PUBLIC_KEY = ${JSON.stringify(PUBLIC_KEY)};

    async function startCheckout() {
      const btn = document.getElementById('pay-btn');
      const errorBox = document.getElementById('error-box');

      // Reset error state
      errorBox.textContent = '';
      errorBox.classList.remove('visible');
      btn.disabled = true;
      btn.textContent = 'Initializing…';

      let reference;
      try {
        const resp = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const data = await resp.json();
        if (!resp.ok || data.error) {
          throw new Error(data.error || 'Server returned an error initializing payment.');
        }
        reference = data.reference;
      } catch (err) {
        errorBox.textContent = 'Could not initialize payment: ' + err.message;
        errorBox.classList.add('visible');
        btn.disabled = false;
        btn.textContent = 'Pay Now';
        return;
      }

      try {
        BursaPayInline.checkout({
          publicKey: PUBLIC_KEY,
          reference: reference,
          onSuccess: function(data) {
            window.location.href = '/callback?reference=' + encodeURIComponent(data.reference || reference);
          },
          onClose: function() {
            btn.disabled = false;
            btn.textContent = 'Pay Now';
          },
        });
      } catch (err) {
        errorBox.textContent = 'Could not launch payment popup: ' + err.message;
        errorBox.classList.add('visible');
        btn.disabled = false;
        btn.textContent = 'Pay Now';
      }
    }
  </script>
`);
  res.send(html);
});

// ── Route: POST /api/checkout — initialize payment ───────────────────────────
app.post('/api/checkout', async (req, res) => {
  const amount       = (req.body && req.body.amount) ? Number(req.body.amount) : PRODUCT.price;
  const email        = (req.body && req.body.email)  ? req.body.email          : PRODUCT.email;
  const callback_url = `http://localhost:${PORT}/callback`;

  try {
    const result = await bp.payments.initialize({ amount, email, callback_url });
    const reference = result.reference || (result.data && result.data.reference);
    if (!reference) {
      return res.status(502).json({ error: 'No reference returned by the API. Check your credentials.' });
    }
    console.log(`[BursaPay] Payment initialized: ${reference}`);
    return res.json({ reference });
  } catch (err) {
    const msg = err.message || String(err);
    console.error(`[BursaPay] Initialize error: ${msg}`);
    return res.status(502).json({ error: `Payment initialization failed: ${msg}` });
  }
});

// ── Route: GET /callback — verify payment ────────────────────────────────────
app.get('/callback', async (req, res) => {
  const reference = (req.query.reference || '').trim();

  if (!reference) {
    return res.status(400).send(basePage('Payment Status — BursaPay Demo', `
  <div class="card">
    <h1>Payment Status</h1>
    <div class="detail-row">
      <span>Status</span>
      <span class="badge badge-error">ERROR</span>
    </div>
    <div style="margin-top:1rem; background:#fff5f5; border:1px solid #feb2b2; border-radius:8px; padding:1rem; color:#c53030; font-size:.9rem;">
      No reference provided. Please complete a payment first.
    </div>
    <a href="/" class="back-link">← Back to checkout</a>
  </div>
`));
  }

  let result;
  try {
    result = await bp.payments.verify(reference);
  } catch (err) {
    const msg = err.message || String(err);
    console.error(`[BursaPay] Verify error for ${reference}: ${msg}`);
    return res.status(502).send(basePage('Payment Status — BursaPay Demo', `
  <div class="card">
    <h1>Payment Status</h1>
    <div class="detail-row">
      <span>Reference</span>
      <strong>${escapeHtml(reference)}</strong>
    </div>
    <div class="detail-row">
      <span>Status</span>
      <span class="badge badge-error">ERROR</span>
    </div>
    <div style="margin-top:1rem; background:#fff5f5; border:1px solid #feb2b2; border-radius:8px; padding:1rem; color:#c53030; font-size:.9rem;">
      Verification failed: ${escapeHtml(msg)}
    </div>
    <a href="/" class="back-link">← Back to checkout</a>
  </div>
`));
  }

  // Unwrap result — SDK may return { data: { ... } } or the object directly
  const payment = (result && result.data) ? result.data : result;
  const status  = (payment && payment.status) ? payment.status : 'unknown';
  const ref     = (payment && payment.reference) ? payment.reference : reference;
  const amount  = (payment && payment.amount != null) ? payment.amount : null;
  const paid_at = (payment && payment.paid_at)  ? payment.paid_at  : null;

  console.log(`[BursaPay] Payment verified: ${ref} | Status: ${status}`);

  if (status === 'success') {
    return res.send(basePage('Payment Successful — BursaPay Demo', `
  <div class="card">
    <h1>🎉 Payment Successful</h1>
    <div class="detail-row">
      <span>Reference</span>
      <strong>${escapeHtml(ref)}</strong>
    </div>
    <div class="detail-row">
      <span>Status</span>
      <span class="badge badge-success">${escapeHtml(status.toUpperCase())}</span>
    </div>
    ${amount != null ? `
    <div class="detail-row">
      <span>Amount</span>
      <strong>₦${Number(amount).toLocaleString('en-NG')}</strong>
    </div>` : ''}
    ${paid_at ? `
    <div class="detail-row">
      <span>Paid at</span>
      <span>${escapeHtml(String(paid_at))}</span>
    </div>` : ''}
    <a href="/" class="back-link">← Back to checkout</a>
  </div>
`));
  }

  // Non-success status — show specific message, not a generic one
  return res.status(402).send(basePage('Payment Status — BursaPay Demo', `
  <div class="card">
    <h1>Payment Status</h1>
    <div class="detail-row">
      <span>Reference</span>
      <strong>${escapeHtml(ref)}</strong>
    </div>
    <div class="detail-row">
      <span>Status</span>
      <span class="badge badge-error">${escapeHtml(status.toUpperCase())}</span>
    </div>
    ${amount != null ? `
    <div class="detail-row">
      <span>Amount</span>
      <strong>₦${Number(amount).toLocaleString('en-NG')}</strong>
    </div>` : ''}
    <div style="margin-top:1rem; background:#fff5f5; border:1px solid #feb2b2; border-radius:8px; padding:1rem; color:#c53030; font-size:.9rem;">
      Payment was not successful. Current status: <strong>${escapeHtml(status)}</strong>.
      Please try again or contact support if the issue persists.
    </div>
    <a href="/" class="back-link">← Back to checkout</a>
  </div>
`));
});

// ── Utility ───────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#x27;');
}

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, () => {
  console.log(`[BursaPay] Server running on http://localhost:${PORT}`);
});
