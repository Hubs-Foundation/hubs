import Store from "../storage/store";

let store;
export function getStore() {
  if (store) {
    return store;
  } else {
    store = new Store();
    return store;
  }
}
