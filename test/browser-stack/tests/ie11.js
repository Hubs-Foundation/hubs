const { until } = require("selenium-webdriver");
const { By: by } = require("selenium-webdriver");
const assert = require("assert");

const { createDriver, setStatusAndQuit } = require("../common/browserstack");

async function runTestWithCaps() {
  const driver = createDriver({
    os: "Windows",
    osVersion: "10",
    browserName: "IE",
    browserVersion: "11",
    sessionName: "IE 11 basic test"
  });

  try {
    await driver.get("https://hubs.mozilla.com");

    const homePageButton = await driver.wait(until.elementLocated(by.css("button")), 10000);
    const homePageButtonText = await homePageButton.getText();

    assert.ok(/create room/i.test(homePageButtonText));

    await setStatusAndQuit(driver, { passed: true });
  } catch (e) {
    await setStatusAndQuit(driver, { failed: true });
    console.error(e);
    process.exit(1);
  }
}

runTestWithCaps();
