import { readFileSync, existsSync } from "fs";
import { exec } from "child_process";
import rmdir from "rimraf";
import ncp from "ncp";
import tar from "tar";

if (!existsSync(".ret.credentials")) {
  console.log("Not logged in, so cannot deploy. To log in, run npm run login.");
  process.exit(0);
}

const { host, token } = JSON.parse(readFileSync(".ret.credentials"));
console.log(`Deploying Hubs to ${host}.`);

const getTs = (() => {
  const p = n => (n < 10 ? `0${n}` : n);
  return () => {
    const d = new Date();
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(
      d.getSeconds()
    )}`;
  };
})();

(async () => {
  const headers = {
    Authorization: `Bearer ${token}`
  };

  const res = await fetch(`https://${host}/api/ita/configs/hubs`, { headers });
  const hubsConfigs = await res.json();
  const buildEnv = {};
  for (const [k, v] of Object.entries(hubsConfigs.general)) {
    buildEnv[k.toUpperCase()] = v;
  }

  buildEnv.BUILD_VERSION = `1.0.0.${getTs()}`;
  const env = Object.assign(process.env, buildEnv);

  //for (const d in ["./dist", "./admin/dist"]) {
  //  rmdir(d, err => {
  //    if (err) {
  //      console.error(err);
  //      process.exit(1);
  //    }
  //  });
  //}

  console.log("Building Hubs Client.");

  //await new Promise((resolve, reject) => {
  //  exec("npm ci", { }, err => {
  //    if (err) reject(err);
  //    resolve();
  //  });
  //});

  //await new Promise((resolve, reject) => {
  //  exec("npm run build", { env }, (err, stdout) => {
  //    if (err) reject(err);
  //    resolve();
  //  });
  //});

  console.log("Building Hubs Admin Console.");

  //await new Promise((resolve, reject) => {
  //  exec("npm ci", { cwd: "./admin" }, err => {
  //    if (err) reject(err);
  //    resolve();
  //  });
  //});

  //await new Promise((resolve, reject) => {
  //  exec("npm run build", { cwd: "./admin", env }, err => {
  //    if (err) reject(err);
  //    resolve();
  //  });
  //});

  //await new Promise(res => {
  //  ncp("./admin/dist", "./dist", err => {
  //    if (err) {
  //      console.error(err);
  //      process.exit(1);
  //    }

  //    res();
  //  });
  //});
  console.log("Packaging Build.");
  await tar.c({ gzip: true, C: "dist", file: "build.tar.gz" }, ["."]);

  process.exit(0);
})();
