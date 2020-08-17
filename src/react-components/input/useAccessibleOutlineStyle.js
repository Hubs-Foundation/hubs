import { useEffect, useCallback } from "react";

// The page is styled by default not to have any outlines on selected input elements.
// When the user presses the tab key the keyboardUserClass is added to the body and all outlines are re-enabled.
// This lets us provide a clean look for mouse users, while still maintaining accessibility for keyboard users.
export function useAccessibleOutlineStyle(keyboardUserClass = "keyboard-user") {
  let onFirstTab = null;

  onFirstTab = useCallback(
    e => {
      if (e.key === "Tab") {
        document.body.classList.add(keyboardUserClass);
        window.removeEventListener("keydown", onFirstTab);
      }
    },
    [keyboardUserClass]
  );

  useEffect(
    () => {
      window.addEventListener("keydown", onFirstTab);

      return () => {
        window.removeEventListener("keydown", onFirstTab);
      };
    },
    [onFirstTab]
  );
}
