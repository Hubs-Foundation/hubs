const { until } = require("selenium-webdriver");
const { By: by } = require("selenium-webdriver");
const assert = require("assert");

const { createDriver, setStatusAndQuit } = require("../common/browserstack");

async function runIE11UnsupportedTest() {
  const driver = createDriver({
    os: "Windows",
    osVersion: "10",
    browserName: "IE",
    browserVersion: "11",
    sessionName: "IE 11 basic test"
  });

  try {
    await driver.get("https://hubs.mozilla.com");

    const unsupportedNotice = await driver.wait(until.elementLocated(by.id("support-root")), 10000);
    const unsupportedNoticeText = await unsupportedNotice.getText();

    assert.ok(/missing required features/i.test(unsupportedNoticeText));

    await setStatusAndQuit(driver, { passed: true });
  } catch (e) {
    await setStatusAndQuit(driver, { failed: true });
    console.error(e);
    process.exit(1);
  }
}

runIE11UnsupportedTest();
