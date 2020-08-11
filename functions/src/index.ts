import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

import Stripe from 'stripe';

import fetch from 'node-fetch'

import * as retry from 'async-retry'

import * as express from 'express';
import * as cors from 'cors';

import {addMonths, subSeconds, getUnixTime} from 'date-fns'

import {
  sign,
  // verify
} from 'jsonwebtoken'

import { v4 as uuidv4 } from 'uuid';

const {
  stripe: {
    key: STRIPE_KEY = 'pk_stripe',
    wh_secret: STRIPE_WH_SECRET = 'wh_stripe',
  },
  dr33m: {
    secret: DR33M_SECRET = 'super_secret',
    admin_id: DR33M_ADMIN_ID = '1234',
  }
} = functions.config()

const stripe = new Stripe(STRIPE_KEY, { apiVersion: '2020-03-02' });

const app = express();

const createJWT = () => {
  const issuedAt = new Date()
  const expireAt = addMonths(issuedAt, 12)
  const notBefore = subSeconds(issuedAt, 1)

  const payload = {
    aud: 'ret',
    iss: 'ret',
    exp: getUnixTime(expireAt),
    iat: getUnixTime(issuedAt),
    nbf: getUnixTime(notBefore),
    jti: uuidv4(),
    sub: DR33M_ADMIN_ID,
    typ: 'access',
  }

  return sign(payload, DR33M_SECRET, {algorithm: 'HS512'})
}

const HUBS_API_BASE = 'https://dr33mphaz3r.net/api/v1';
const HUBS_AUTH_HEADER = { 'Authorization': `Bearer ${createJWT()}` }

// `null` if not present
const lookup = async (email : string) => {
  const res = await fetch(`${HUBS_API_BASE}/accounts/search`, {
    method: 'POST',
    headers: { ...HUBS_AUTH_HEADER, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  if (!res.ok) {
    console.error(await res.text())
    return null
  }

  const data = await res.json()

  const {data: [{ identity: { name }, id }]} = data

  return {email, name, id}
}

const createAccount = async ({ email, name } : User) => {
  const res = await fetch(`${HUBS_API_BASE}/accounts`, {
    method: 'POST',
    headers: { ...HUBS_AUTH_HEADER, 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { email, name }})
  });

  return res.ok ? lookup(email) : null
}

/*
const updateAccount = async (email : string, name : string) => {
  const res = await fetch(`${HUBS_API_BASE}/accounts`, {
    method: 'PATCH',
    headers: { ...HUBS_AUTH_HEADER, 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: {email, name} })
  });

  if (!res.ok) return null

  const data = await res.json()

  const { data: { id }} = data

  return {email, name, id}
}
*/


app.use(cors({ origin: true }));

// dr33mphaz3r
///////////////////////////////////////////////////////////////////////////////////////////////////

app.post('/search', async (req, res) => {
  const { email } = req.body
  const user = await lookup(email)

  if (user)
    res.send(user)
  else
    res.sendStatus(404)
})

// Stripe
///////////////////////////////////////////////////////////////////////////////////////////////////

// Generate a payment intent
app.post('/payment/intents', async (req, res) => {
  const paymentIntentParams : Stripe.PaymentIntentCreateParams = req.body;

  const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

  res.send(paymentIntent);
});

// Notify payment's status
app.post('/payment/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string

  let event

  try {
    event = stripe.webhooks.constructEvent(req.body.rawBody, sig, STRIPE_WH_SECRET)
  } catch (err) {
    res.status(400).end()
    return
  }

  console.log({event})

  const intent = event.data.object

  // Handle Type of webhook
  switch (event.type) {
    case 'payment_intent.succeeded':
      // Create user account
      console.log("Payment Success:", { intent });

      const user = parseSuccess(intent)

      let createdUser

      try  {
        createdUser = await retry(async () => { 
          const created = await createAccount(user)
          if (!created) throw new Error(`Failed to create user : ${ user }`)
          return created
        }, { retries: 5 })
      } catch(e) {
        res.status(500).send('Failed to create user after successful payment').end()
        return
      }

      console.log('Account Creation Success:', { createdUser })

      break;
    case 'payment_intent.payment_failed':
      // const message = intent.last_payment_error && intent.last_payment_error.message
      console.log('Failed:', { intent })
      break;
  }

  res.sendStatus(200);
});

interface User {
  email : string
  name : string
}

const parseSuccess = (intent : any) => {
  const {
    charges: {
      data: [{ metadata: { email, name }}]
    }
  } : { charges: { data: {metadata: User}[]}} = intent

  return {email, name}
}

export const dr33mphaz3r = functions.https.onRequest(app);
