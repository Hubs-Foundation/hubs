import React, { createContext, useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import configs from "../../utils/configs";

// TODO: We really shouldn't include these dependencies on every page. A dynamic import would work better.
import jwtDecode from "jwt-decode";
import AuthChannel from "../../utils/auth-channel";
import { connectToReticulum } from "../../utils/phoenix-utils";

export const AuthContext = createContext();

export function AuthContextProvider({ children, store }) {
  const signIn = useCallback(
    async email => {
      const authChannel = new AuthChannel(store);
      const socket = await connectToReticulum();
      authChannel.setSocket(socket);
      const { authComplete } = await authChannel.startAuthentication(email);
      await authComplete;

      // TODO: Doing all of this just to determine if the user is an admin seems unnecessary. The auth callback should have the isAdmin flag.
      const retPhxChannel = socket.channel("ret", { hub_id: "index", token: store.state.credentials.token });

      const perms = await new Promise(resolve => {
        retPhxChannel.join().receive("ok", () => {
          retPhxChannel.push("refresh_perms_token").receive("ok", ({ perms_token }) => {
            const perms = jwtDecode(perms_token);
            retPhxChannel.leave();
            resolve(perms);
          });
        });
      });

      configs.setIsAdmin(perms.postgrest_role === "ret_admin");
      store.update({ credentials: { isAdmin: perms.postgrest_role === "ret_admin" } });
    },
    [store]
  );

  const verify = useCallback(
    async authParams => {
      const authChannel = new AuthChannel(store);
      const socket = await connectToReticulum();
      authChannel.setSocket(socket);
      await authChannel.verifyAuthentication(authParams.topic, authParams.token, authParams.payload);
    },
    [store]
  );

  const signOut = useCallback(
    async () => {
      store.update({ credentials: { token: null, email: null, isAdmin: false } });
      await store.resetToRandomDefaultAvatar();
    },
    [store]
  );

  const [context, setContext] = useState({
    isSignedIn: !!store.state.credentials.token,
    isAdmin: store.state.credentials.isAdmin,
    email: store.state.credentials.email,
    userId: store.credentialsAccountId,
    signIn,
    verify,
    signOut
  });

  // Trigger re-renders when the store updates
  useEffect(
    () => {
      const onStoreChanged = () => {
        setContext(state => ({
          ...state,
          isSignedIn: !!store.credentials,
          isAdmin: store.isAdmin,
          email: store.credentials && store.credentials.email,
          userId: store.credentialsAccountId
        }));
      };

      store.addEventListener("statechanged", onStoreChanged);

      return () => {
        store.removeEventListener("statechanged", onStoreChanged);
      };
    },
    [store, setContext]
  );

  return <AuthContext.Provider value={context}>{children}</AuthContext.Provider>;
}

AuthContextProvider.propTypes = {
  children: PropTypes.node,
  store: PropTypes.object.isRequired
};
