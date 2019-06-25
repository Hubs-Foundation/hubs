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

  verifyAuthentication(authTopic, authToken) {
    const channel = this.socket.channel(authTopic);
    return new Promise((resolve, reject) =>
      channel
        .join()
        .receive("ok", () => {
          let receivedEmail;
          let receivedToken;

          // On the verifier side, also update local storage so we log in on both sides.
          //
          // In the case where it's the same browser, it should be updated with the same values in
          // both tabs, so nbd.
          const storeCredentials = async () => {
            if (!receivedEmail || !receivedToken) return;
            await this.handleAuthCredentials(receivedEmail, receivedToken);
            resolve();
          };

          // We need to receive both the credentials token and the email (these come over via separate messages,
          // since the email needs to be send from the origin process)
          //
          // If the user closed the other tab, which would cause the email to not show up, or the token failed,
          // give up after a timeout.
          setTimeout(() => {
            if (!receivedEmail || !receivedToken) resolve();
          }, 5000);

          channel.on("auth_credentials", async ({ credentials: token }) => {
            receivedToken = token;
            storeCredentials();
          });

          channel.on("auth_email", async ({ email: email }) => {
            receivedEmail = email;
            storeCredentials();
          });

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
