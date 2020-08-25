import { createContext } from "react";

export const RoomContext = createContext({
  url: undefined,
  code: undefined,
  embed: undefined
});
