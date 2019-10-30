import { waitForDOMContentLoaded } from "./async-utils";

waitForDOMContentLoaded().then(() => {
  const el = document.querySelector(`meta[name='theme']`);
  const theme = el ? el.getAttribute("content") : "light";
  document.body.classList.add(`${theme}-theme`);
});
