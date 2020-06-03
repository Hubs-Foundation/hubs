const path = require("path");
const Commander = require("commander");
const packageJson = require("../package.json");
const spawn = require("cross-spawn");

function getHubsConfigPath(hubsConfigPath) {
  hubsConfigPath = hubsConfigPath || "hubs.config.js";
  hubsConfigPath = hubsConfigPath.trim(hubsConfigPath);
  hubsConfigPath = path.resolve(process.cwd(), hubsConfigPath);
  return hubsConfigPath;
}

function run(cmd, args) {
  const result = spawn.sync(cmd, args, { stdio: "inherit" });

  if (result.signal) {
    process.exit(1);
  }

  process.exit(result.status);
}

const program = new Commander.Command("hubs").version(packageJson.version);

program.command("start [hubs-config-path]").action(hubsConfigPath => {
  const webpackDevServerPath = path.resolve(__dirname, "..", "node_modules", ".bin", "webpack-dev-server");
  const webpackConfigPath = path.resolve(__dirname, "..", "webpack.config.js");
  hubsConfigPath = getHubsConfigPath(hubsConfigPath);
  run(webpackDevServerPath, [
    `--config=${webpackConfigPath}`,
    "--mode=development",
    "--env.loadAppConfig",
    `--env.hubsConfig=${hubsConfigPath}`
  ]);
});

program.command("deploy [hubs-config-path]").action(hubsConfigPath => {
  const deployScriptPath = path.resolve(__dirname, "..", "scripts", "deploy.js");
  hubsConfigPath = getHubsConfigPath(hubsConfigPath);
  run("node", ["-r", "@babel/register", "-r", "esm", "-r", "./scripts/shim", deployScriptPath, hubsConfigPath]);
});

program.command("login").action(() => {
  const loginScriptPath = path.resolve(__dirname, "..", "scripts", "login.js");
  run("node", ["-r", "@babel/register", "-r", "esm", "-r", "./scripts/shim", loginScriptPath]);
});

program.command("logout").action(() => {
  const logoutScriptPath = path.resolve(__dirname, "..", "scripts", "logout.js");
  run("node", ["-r", "@babel/register", "-r", "esm", "-r", "./scripts/shim", logoutScriptPath]);
});

program.parse(process.argv);
