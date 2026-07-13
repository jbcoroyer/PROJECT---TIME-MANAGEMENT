import fs from "node:fs";
import Stripe from "stripe";

const env = fs.readFileSync(".env.local", "utf8");
const secret = env.match(/^STRIPE_WEBHOOK_SECRET=(.+)$/m)?.[1]?.trim();
if (!secret) {
  console.error("STRIPE_WEBHOOK_SECRET introuvable dans .env.local");
  process.exit(1);
}

const event = {
  id: `evt_test_workspace_${Date.now()}`,
  object: "event",
  api_version: "2024-06-20",
  created: Math.floor(Date.now() / 1000),
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_test_workspace",
      object: "checkout.session",
      metadata: {},
      client_reference_id: null,
      customer: null,
      subscription: null,
    },
  },
};

const payload = JSON.stringify(event);
const stripe = new Stripe("sk_test_placeholder");
const header = stripe.webhooks.generateTestHeaderString({ payload, secret });

const url = "https://project-time-management.vercel.app/api/webhooks/stripe";
const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "stripe-signature": header,
  },
  body: payload,
});

const text = await res.text();
console.log(`HTTP ${res.status}`);
console.log(text);
