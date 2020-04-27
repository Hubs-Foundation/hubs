import React, { useState, useRef, useContext, useEffect, createContext } from "react";
import PropTypes from "prop-types";
import { Overlay } from "./Overlay";

const DialogControlContext = createContext({ showDialog: () => {}, hideDialog: () => {} });

// Separate context so that changing the dialog doesn't re-render components that use the DialogControlContext
const DialogDisplayContext = createContext();

export function useDialog() {
  return useContext(DialogControlContext);
}

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState();

  const dialogContextRef = useRef();

  useEffect(
    () => {
      dialogContextRef.current = {
        showDialog: (Component, props) => {
          setDialog({ Component, props });
        },
        hideDialog: () => {
          setDialog(null);
        }
      };
    },
    [setDialog]
  );

  return (
    <DialogControlContext.Provider value={dialogContextRef.current}>
      <DialogDisplayContext.Provider value={dialog}>{children}</DialogDisplayContext.Provider>
    </DialogControlContext.Provider>
  );
}

DialogProvider.propTypes = {
  children: PropTypes.node,
  tag: PropTypes.elementType.isRequired
};

export function DialogContainer({ children, tag, ...rest }) {
  const DialogContainerEl = tag;

  const dialog = useContext(DialogDisplayContext);
  const dialogControl = useContext(DialogControlContext);

  return (
    <DialogContainerEl {...rest}>
      <Overlay active={!!dialog}>{children}</Overlay>
      {dialog && <dialog.Component {...dialogControl} {...dialog.props} />}
    </DialogContainerEl>
  );
}

DialogContainer.propTypes = {
  children: PropTypes.node,
  tag: PropTypes.elementType.isRequired
};

DialogContainer.defaultProps = {
  tag: "main"
};
