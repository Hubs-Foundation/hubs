module.exports = {
  // This origin trial token is used to enable WebVR and Gamepad Extensions on Chrome 62+
  // You can find more information about getting your own origin trial token here: https://github.com/GoogleChrome/OriginTrials/blob/gh-pages/developer-guide.md
  originTrialToken:
    "AvIMoF4hyRZQVfSfksoqP+7qzwa4FSBzHRHvUyzC8rMATJVRbcOiLewBxbXtJVyV3N62gsZv7PoSNtDqqtjzYAcAAABkeyJvcmlnaW4iOiJodHRwczovL3JldGljdWx1bS5pbzo0NDMiLCJmZWF0dXJlIjoiV2ViVlIxLjFNNjIiLCJleHBpcnkiOjE1MTYxNDYyMDQsImlzU3ViZG9tYWluIjp0cnVlfQ==",
  originTrialExpires: "2018-01-16",

  // These variables are availible on the window.CONFIG object
  // The exported object must be a valid argument to JSON.stringify()
  global: {
    janus_server_url:
      process.env.JANUS_SERVER || "wss://dev-janus.reticulum.io",
    public_rooms: [1, 2, 3, 4, 5],
    default_room: 1,
    polyAPIKey: "AIzaSyD_tHvQQCRsttfGEjtF4SQa2Vj_Td3cak8"
  }
};
