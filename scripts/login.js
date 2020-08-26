import readline from "readline";
import { connectToReticulum } from "../src/utils/phoenix-utils";
import Store from "../src/storage/store";
import AuthChannel from "../src/utils/auth-channel";
import configs from "../src/utils/configs.js";
import { Socket } from "phoenix-channels";

import chalk from "chalk";

import { writeFileSync } from "fs";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const ask = q => new Promise(res => rl.question(q, res));

(async () => {
  console.log(chalk.red.bold("\nc̥̣̟̣͖̼ö͔̱̗̼̦̻̊ͬ̐m̜̞̠ͥ̑̃̏ͣͩͬm͔̼̝̹͇e͖̖͌̇̚n̜͖̠̂ͯc͖͉ͅe̫͉͚͉̤ͮ͐ͫ ͇͈̰͙͓̜̠ͭ̊.͇̭̯͇͎̥͊̆ͅ.̺̖̮̖̬̪̔̓ͦͤ͛͒.̋ ̺̪̬̝͈̺d̩̪̎̏ͥ̾r̬̎3͍̮͚̟̠͆̈̽3͖̘͖̒̽̐ͥ̉͗̚m̃͌ḯ̘̖̻̟̩ͧ̀n͔ͨͮ̍̊g̈́̔\n\n"));

  const host = "dr33mphaz3r.net"

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
  const store = new Store();

  const email = process.env.DR33M_EMAIL || await ask("admin email: ");

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
