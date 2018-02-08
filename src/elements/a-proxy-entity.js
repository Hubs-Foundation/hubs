AFRAME.registerElement("a-proxy-entity", {
  prototype: Object.create(HTMLElement.prototype, {
    attachedCallback: {
      value() {
        const waitForEvent = this.getAttribute("wait-for-event");

        const attachTemplate = () => {
          const selector = this.getAttribute("selector");
          const targetEls = this.parentNode.querySelectorAll(selector);

          const template = this.firstElementChild;
          const clone = document.importNode(template.content, true);
          const templateRoot = clone.firstElementChild;
          const templateRootAttrs = templateRoot.attributes;

          for (var i = 0; i < targetEls.length; i++) {
            const targetEl = targetEls[i];

            // Merge root element attributes with the target element
            for (var i = 0; i < elAttrs.length; i++) {
              targetEl.setAttribute(
                templateRootAttrs[i].name,
                templateRootAttrs[i].value
              );
            }

            // Append all child elements
            for (var i = 0; i < templateRoot.children.length; i++) {
              targetEl.appendChild(
                document.importNode(templateRoot.children[i], true)
              );
            }
          }
        };

        if (waitForEvent != null) {
          this.parentNode.addEventListener(waitForEvent, attachTemplate, {
            once: true
          });
        } else {
          attachTemplate();
        }
      }
    },
    detachedCallback: {
      value() {
        const waitForEvent = this.getAttribute("wait-for-event");

        if (waitForEvent != null) {
          this.parentNode.removeEventListener(
            waitForEvent,
            this.attachTemplate
          );
        }
      }
    }
  })
});
