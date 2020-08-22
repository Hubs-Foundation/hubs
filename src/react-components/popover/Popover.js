import React, { useState, useCallback, useEffect } from "react";
// Note react-popper-2 is just an alias to react-popper@2.2.3 because storybook is depending on an old version.
// https://github.com/storybookjs/storybook/issues/10982
import { usePopper } from "react-popper-2";
import styles from "./Popover.scss";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { useCssBreakpoints } from "react-use-css-breakpoints";
import classNames from "classnames";
import { ReactComponent as CloseIcon } from "../icons/Close.svg";
import { ReactComponent as PopoverArrow } from "./PopoverArrow.svg";

export function Popover({ content: Content, children, title, placement, initiallyVisible }) {
  const [visible, setVisible] = useState(initiallyVisible);
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const [arrowElement, setArrowElement] = useState(null);
  const {
    styles: { popper: popperStyles, arrow: arrowStyles },
    attributes
  } = usePopper(referenceElement, popperElement, {
    placement,
    modifiers: [{ name: "arrow", options: { element: arrowElement } }, { name: "offset", options: { offset: [0, 16] } }]
  });
  const breakpoint = useCssBreakpoints();
  const fullscreen = breakpoint === "sm";
  const closePopover = useCallback(() => setVisible(false), [setVisible]);
  const togglePopover = useCallback(() => setVisible(visible => !visible), [setVisible]);

  useEffect(
    () => {
      const onClick = e => {
        if (
          (referenceElement && referenceElement.contains(e.target)) ||
          (popperElement && popperElement.contains(e.target))
        ) {
          return;
        }

        setVisible(false);
      };

      if (visible) {
        window.addEventListener("click", onClick);
      }

      return () => {
        window.removeEventListener("click", onClick);
      };
    },
    [visible, popperElement, referenceElement]
  );

  return (
    <>
      {children({
        togglePopover,
        popoverVisible: visible,
        triggerRef: setReferenceElement
      })}
      {visible &&
        createPortal(
          <div
            ref={setPopperElement}
            className={classNames(styles.popover, { [styles.fullscreen]: fullscreen })}
            style={fullscreen ? undefined : popperStyles}
            {...attributes.popper}
          >
            <div className={styles.header}>
              <button onClick={closePopover}>
                <CloseIcon />
              </button>
              <h5>{title}</h5>
            </div>
            <div className={styles.content}>
              {typeof Content === "function" ? <Content closePopover={closePopover} /> : Content}
            </div>
            {!fullscreen && (
              <div ref={setArrowElement} className={styles.arrow} style={arrowStyles}>
                <PopoverArrow />
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}

Popover.propTypes = {
  initiallyVisible: PropTypes.bool,
  placement: PropTypes.string,
  title: PropTypes.string.isRequired,
  children: PropTypes.func.isRequired,
  content: PropTypes.oneOfType([PropTypes.func, PropTypes.node])
};

Popover.defaultProps = {
  initiallyVisible: false,
  placement: "auto"
};
