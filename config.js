module.exports = {
  originTrialToken:
    "AvIMoF4hyRZQVfSfksoqP+7qzwa4FSBzHRHvUyzC8rMATJVRbcOiLewBxbXtJVyV3N62gsZv7PoSNtDqqtjzYAcAAABkeyJvcmlnaW4iOiJodHRwczovL3JldGljdWx1bS5pbzo0NDMiLCJmZWF0dXJlIjoiV2ViVlIxLjFNNjIiLCJleHBpcnkiOjE1MTYxNDYyMDQsImlzU3ViZG9tYWluIjp0cnVlfQ==",
  originTrialExpires: "2018-01-16",

  // These variables are availible on the window.GLOBAL object
  // The exported object must be a valid argument to JSON.stringify()
  global: {
    janus_server_url:
      process.env.JANUS_SERVER || "wss://dev-janus.reticulum.io",
    public_rooms: [1, 2, 3, 4, 5],
    default_room: 1
  }
};
