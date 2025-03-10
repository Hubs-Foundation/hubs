import readline from "readline";
import { connectToReticulum } from "../src/utils/phoenix-utils";
import AuthChannel from "../src/utils/auth-channel";
import configs from "../src/utils/configs.js";
import { Socket } from "phoenix-channels";
import { writeFileSync } from "fs";
import { store } from "../src/utils/store-instance";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const ask = q => new Promise(res => rl.question(q, res));

(async () => {
  console.log("Logging into Hubs Cloud.\n");
  const host = await ask("Host (eg demo.hubsfoundation.org): ");
  if (!host) {
    console.log("Invalid host.");
    process.exit(1);
  }

  const url = `https://${host}/api/v1/meta`;
  try {
    const res = await fetch(url);
    const meta = await res.json();

    if (!meta.phx_host) {
      throw new Error();
    }
  } catch (e) {
    console.log("Sorry, that doesn't look like a Hubs Cloud server.");
    process.exit(0);
  }

  configs.RETICULUM_SERVER = host;
  configs.RETICULUM_SOCKET_PROTOCOL = "wss:";

  const socket = await connectToReticulum(false, null, Socket);

  const email = await ask("Your admin account email (eg admin@yoursite.com): ");
  console.log(`Logging into ${host} as ${email}. Click on the link in your email to continue.`);
  const authChannel = new AuthChannel(store);
  authChannel.setSocket(socket);
  const { authComplete } = await authChannel.startAuthentication(email);
  await authComplete;
  const { token } = store.state.credentials;
  const creds = {
    host,
    email,
    token
  };

  writeFileSync(".ret.credentials", JSON.stringify(creds));
  rl.close();
  console.log("Login successful.\nCredentials written to .ret.credentials. Run npm run logout to remove credentials.");
  process.exit(0);
})();
