function getParentModelInflatorEl(el) {
  let cur = el;

  while (cur && !cur.hasAttribute("model-inflator")) {
    cur = cur.parentNode;
  }

  if (cur.hasAttribute("model-inflator")) {
    return cur;
  }

  return undefined;
}

AFRAME.registerElement("a-proxy-entity", {
  prototype: Object.create(HTMLElement.prototype, {
    attachedCallback: {
      value() {
        this.inflatorEl = getParentModelInflatorEl(this);

        if (!this.inflatorEl) {
          throw new Error(
            "a-proxy-entity could not find parent element with model-inflator component."
          );
        }

        this.onModelLoad = () => {
          setTimeout(() => {
            const selector = this.getAttribute("selector");
            const targetEls = this.inflatorEl.querySelectorAll(selector);
            const attributeNames = this.getAttributeNames();

            for (const attributeName of attributeNames) {
              const attributeValue = this.getAttribute(attributeName);
              if (AFRAME.components[attributeName] !== undefined) {
                for (const el of targetEls) {
                  el.setAttribute(attributeName, attributeValue);
                }
              }
            }

            this.parentNode.removeChild(this);
          }, 0);
        };

        this.inflatorEl.addEventListener("model-loaded", this.onModelLoad, {
          once: true
        });
      }
    },
    detachedCallback: {
      value() {
        this.inflatorEl.removeEventListener("model-loaded", this.onModelLoad);
      }
    }
  })
});
