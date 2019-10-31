import { waitForDOMContentLoaded } from "./async-utils";

waitForDOMContentLoaded().then(() => {
  const el = document.querySelector(`meta[name='theme']`);
  const theme = el ? el.getAttribute("content") : "light";
  document.body.classList.add(`${theme}-theme`);

  document.querySelector("#rounded-text-button").setAttribute("text-button", {
    textHoverColor: "#ff3464",
    textColor: "#ff3464",
    backgroundColor: "#fff",
    backgroundHoverColor: "#aaa"
  });

  document.querySelector("#rounded-button").setAttribute("text-button", {
    textHoverColor: "#ff3464",
    textColor: "#ff3464",
    backgroundColor: "#fff",
    backgroundHoverColor: "#aaa"
  });
  document.querySelector("#rounded-text-action-button").setAttribute("text-button", {
    textHoverColor: "#fff",
    textColor: "#fff",
    backgroundColor: "#ff3464",
    backgroundHoverColor: "#fc3545"
  });

  document.querySelector("#rounded-action-button").setAttribute("text-button", {
    textHoverColor: "#fff",
    textColor: "#fff",
    backgroundColor: "#ff3464",
    backgroundHoverColor: "#fc3545"
  });
});

function applyThemeToTextButton(el, highlighted) {
  el.setAttribute("text-button", "backgroundColor", highlighted ? "#fff" : "#ff3550");
  el.setAttribute("text-button", "backgroundHoverColor", highlighted ? "#bbb" : "#fc3545");
}

export { applyThemeToTextButton };
