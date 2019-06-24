import uuid from "uuid/v4";

export default class AuthChannel {
  constructor(store) {
    this.store = store;
    this.socket = null;
    this._signedIn = !!this.store.state.credentials.token;
  }

  setSocket = socket => {
    this.socket = socket;
  };

  get email() {
    return this.store.state.credentials.email;
  }

  get signedIn() {
    return this._signedIn;
  }

  signOut = async hubChannel => {
    if (hubChannel) {
      await hubChannel.signOut();
    }
    this.store.update({ credentials: { token: null, email: null } });
    this.store.resetToRandomLegacyAvatar();
    this._signedIn = false;
  };

  async verifyAuthentication(authTopic, authToken) {
    const channel = this.stocket.channel(authTopic);
    await new Promise((resolve, reject) =>
      channel
        .join()
        .receive("ok", () => {
          channel.push("auth_verified", { token: authToken });
        })
        .receive("error", reject)
    );
  }

  async startAuthentication(email, hubChannel) {
    const channel = this.socket.channel(`auth:${uuid()}`);
    await new Promise((resolve, reject) =>
      channel
        .join()
        .receive("ok", resolve)
        .receive("error", reject)
    );

    const authComplete = new Promise(resolve =>
      channel.on("auth_credentials", async ({ credentials: token }) => {
        await this.handleAuthCredentials(email, token, hubChannel);
        resolve();
      })
    );

    channel.push("auth_request", { email, origin: "hubs" });

    // Returning an object with the authComplete promise since we want the caller to wait for the above await but not
    // for authComplete.
    return { authComplete };
  }

  async handleAuthCredentials(email, token, hubChannel) {
    this.store.update({ credentials: { email, token } });

    if (hubChannel) {
      await hubChannel.signIn(token);
    }

    this._signedIn = true;
  }
}
