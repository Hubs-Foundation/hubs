require("./keep-alive");

const webdriver = require("selenium-webdriver");

function createDriver({ os, osVersion, browserName, browserVersion, sessionName }) {
  // https://www.browserstack.com/automate/capabilities?tag=selenium-4
  const capabilities = {
    "bstack:options": {
      os,
      osVersion,
      video: "true",
      projectName: "Hubs",
      buildName: `Hubs build ${process.env.GITHUB_RUN_ID} ${process.env.GITHUB_SHA}`,
      sessionName
    },
    browserName,
    browserVersion
  };

  const username = process.env.BROWSER_STACK_USER_NAME;
  const accessKey = process.env.BROWSER_STACK_ACCESS_KEY;

  const driver = new webdriver.Builder()
    .usingServer(`https://${username}:${accessKey}@hub-cloud.browserstack.com/wd/hub`)
    .withCapabilities(capabilities)
    .build();

  return driver;
}

function setSessionStatus(driver, { passed, failed, reason = "" }) {
  // https://www.browserstack.com/docs/automate/selenium/set-name-and-status-of-test#example
  const executorAction = {
    action: "setSessionStatus",
    arguments: { reason }
  };

  if (passed) {
    executorAction.arguments.status = "passed";
  } else if (failed) {
    executorAction.arguments.status = "failed";
  }

  return driver.executeScript(`browserstack_executor: ${JSON.stringify(executorAction)}`);
}

async function setStatusAndQuit(driver, status) {
  await setSessionStatus(driver, status);
  await driver.quit();
}

module.exports = { createDriver, setStatusAndQuit };
