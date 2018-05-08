// NOTE: We do not use an IV since we generate a new keypair each time we use these routines.

async function deriveKey(privateKey, publicKey) {
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: publicKey },
    privateKey,
    { name: "AES-CBC", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

async function publicKeyToString(key) {
  return JSON.stringify(await crypto.subtle.exportKey("jwk", key));
}

async function stringToPublicKey(s) {
  return await crypto.subtle.importKey("jwk", JSON.parse(s), { name: "ECDH", namedCurve: "P-256" }, true, []);
}

function stringToArrayBuffer(s) {
  const buf = new Uint8Array(s.length);

  for (let i = 0; i < s.length; i++) {
    buf[i] = s.charCodeAt(i);
  }

  return buf;
}

function arrayBufferToString(b) {
  const buf = new Uint8Array(b);
  let s = "";

  for (let i = 0; i < buf.byteLength; i++) {
    s += String.fromCharCode(buf[i]);
  }

  return s;
}

// This allows a single object to be passed encrypted from a receiver in a req -> response flow

// Requestor generates a public key and private key, and should send the public key to receiver.
export async function generateKeys() {
  const keyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey"]);
  const publicKeyString = await publicKeyToString(keyPair.publicKey);
  return { publicKeyString, privateKey: keyPair.privateKey };
}

// Receiver takes the public key from requestor and passes obj to get a response public key and the encrypted data to return.
export async function generatePublicKeyAndEncryptedObject(incomingPublicKeyString, obj) {
  const iv = new Uint8Array(16);
  const incomingPublicKey = await stringToPublicKey(incomingPublicKeyString);
  const keyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey"]);
  const publicKeyString = await publicKeyToString(keyPair.publicKey);
  const secret = await deriveKey(keyPair.privateKey, incomingPublicKey);

  const encryptedData = btoa(
    arrayBufferToString(
      await crypto.subtle.encrypt({ name: "AES-CBC", iv }, secret, stringToArrayBuffer(JSON.stringify(obj)))
    )
  );

  return { publicKeyString, encryptedData };
}

// Requestor then takes the receiver's public key, the private key (returned from generateKeys()), and the data from the receiver.
export async function decryptObject(publicKeyString, privateKey, base64value) {
  const iv = new Uint8Array(16);
  const publicKey = await stringToPublicKey(publicKeyString);
  const secret = await deriveKey(privateKey, publicKey);
  const ciphertext = stringToArrayBuffer(atob(base64value));
  const data = await crypto.subtle.decrypt({ name: "AES-CBC", iv }, secret, ciphertext);
  return JSON.parse(arrayBufferToString(data));
}
