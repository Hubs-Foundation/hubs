export const waitForEvent = function(eventName, eventObj) {
  return new Promise(resolve => {
    eventObj.addEventListener(eventName, resolve, { once: true });
  });
};

export const waitForDOMContentLoaded = function() {
  if (document.readyState === "complete" || document.readyState === "loaded" || document.readyState === "interactive") {
    return Promise.resolve(null);
  } else {
    return waitForEvent("DOMContentLoaded", window);
  }
};
