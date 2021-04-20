import { useEffect, useState } from "react";

// The page is styled by default not to have any outlines on selected input elements.
// When the user presses the tab key the keyboardUserClass is added to the body and all outlines are re-enabled.
// The next time you click this keyboardUserClass will be removed, removing the outline styles.
// This lets us provide a clean look for mouse users, while still maintaining accessibility for keyboard users.
export function useAccessibleOutlineStyle(keyboardUserClass = "keyboard-user") {
  const [keyboardUser, setKeyboardUser] = useState(false);

  useEffect(
    () => {
      function onMouseDown() {
        if (keyboardUser) {
          document.body.classList.remove(keyboardUserClass);
          setKeyboardUser(false);
        }
      }

      function onKeyDown(e) {
        if (e.key === "Tab" && !keyboardUser) {
          document.body.classList.add(keyboardUserClass);
          setKeyboardUser(true);
        }
      }

      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("mousedown", onMouseDown);

      return () => {
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("mousedown", onMouseDown);
      };
    },
    [keyboardUserClass, keyboardUser]
  );
}
