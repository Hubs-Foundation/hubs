const fetch = require('node-fetch')
const jwt = require('jsonwebtoken')
const {v4: uuidv4} = require('uuid')

const addMonths = require('date-fns/addMonths')
const getUnixTime = require('date-fns/getUnixTime')
const subSeconds = require('date-fns/subSeconds')

const { ADMIN_ID, JWT_SECRET } = process.env
const API_BASE = 'https://dr33mphaz3r.net/api/v1';

// Top level async
const main = async () => {

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
      sub: ADMIN_ID,
      typ: 'access',
    }

    return jwt.sign(payload, JWT_SECRET, {algorithm: 'HS512'})
  }

  const AUTH_HEADER = { 'Authorization': `Bearer ${createJWT()}` }

  // `null` if not present
  const lookup = async (email) => {
    const res = await fetch(`${API_BASE}/accounts/search`, {
      method: 'POST',
      headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (!res.ok) return null

    const data = await res.json()

    const {data: [{ identity: { name }, id }]} = data

    return {email, name, id}
  }

  const createAccount = async (email, name) => {
    const res = await fetch(`${API_BASE}/accounts`, {
      method: 'POST',
      headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { email, name }})
    });

    return res.ok ? lookup(email) : null
  }

  const updateAccount = async (email, name) => {
    const res = await fetch(`${API_BASE}/accounts`, {
      method: 'PATCH',
      headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: {email, name} })
    });

    if (!res.ok) return null

    const data = await res.json()

    const { data: { id, identity: { name }}} = data

    return {email, name, id}
  }

  const display = (email) => lookup(email).then((user) => console.log(`${email}: ${ user ? JSON.stringify(user) : 'not found :(' }`))

  await display('caspianbaska@gmail.com')
  await display('caspianbaska@gmai.com')
}

main()
