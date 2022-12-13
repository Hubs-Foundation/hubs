import { $isStringType, NetworkedMediaFrame } from "../bit-components";

// TODO HACK gettting internal bitecs symbol, should expose createShadow
const $parentArray = Object.getOwnPropertySymbols(NetworkedMediaFrame.scale).find(s => s.description == "parentArray");
const $storeFlattened = Object.getOwnPropertySymbols(NetworkedMediaFrame).find(s => s.description == "storeFlattened");

const createShadow = (store, key) => {
  if (!ArrayBuffer.isView(store)) {
    const shadowStore = store[$parentArray].slice(0);
    store[key] = store.map((_, eid) => {
      const { length } = store[eid];
      const start = length * eid;
      const end = start + length;
      return shadowStore.subarray(start, end);
    });
  } else {
    store[key] = store.slice(0);
  }
  return key;
};

// TODO this array encoding is silly, use a buffer once we are not sending JSON
export function defineNetworkSchemaForProps(componentProps) {
  const shadowSymbols = componentProps.map((prop, i) => {
    return createShadow(prop, Symbol(`netshadow-${i}`));
  });

  return {
    serialize(_world, eid, data, isFullSync, writeToShadow) {
      const changedPids = [];
      data.push(changedPids);
      for (let pid = 0; pid < componentProps.length; pid++) {
        const prop = componentProps[pid];
        const shadow = prop[shadowSymbols[pid]];
        // if property is an array
        if (ArrayBuffer.isView(prop[eid])) {
          for (let i = 0; i < prop[eid].length; i++) {
            if (isFullSync || shadow[eid][i] !== prop[eid][i]) {
              changedPids.push(pid);
              // TODO handle EID type and arrays of strings
              data.push(Array.from(prop[eid]));
              break;
            }
          }
          if (writeToShadow) shadow[eid].set(prop[eid]);
        } else {
          if (isFullSync || shadow[eid] !== prop[eid]) {
            changedPids.push(pid);
            // TODO handle EID type
            data.push(prop[$isStringType] ? APP.getString(prop[eid]) : prop[eid]);
          }
          if (writeToShadow) shadow[eid] = prop[eid];
        }
      }
      if (!changedPids.length) {
        data.pop();
        return false;
      }
      return true;
    },
    deserialize(_world, eid, data) {
      const updatedPids = data[data.cursor++];
      for (let i = 0; i < updatedPids.length; i++) {
        const pid = updatedPids[i];
        const prop = componentProps[pid];
        const shadow = prop[shadowSymbols[pid]];
        // TODO updating the shadow here is slightly odd. Should taking ownership do it?
        if (ArrayBuffer.isView(prop[eid])) {
          prop[eid].set(data[data.cursor++]);
          shadow[eid].set(prop[eid]);
        } else {
          const val = data[data.cursor++];
          prop[eid] = prop[$isStringType] ? APP.getSid(val) : val;
          shadow[eid] = prop[eid];
        }
      }
    }
  };
}

export function defineNetworkSchema(Component) {
  return defineNetworkSchemaForProps(Component[$storeFlattened]);
}
