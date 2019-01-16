// Utilities for manipulating state history. This provides a number of functions which
// need to be used to manipulate history state so we can deal with edge cases around
// entry back button and refreshes once entered.
//

// This pushes/replaces a new k, v pair into the history, while maintaining all the other
// keys, or clears state if k if null.
//
// Also maintains a length key that can be used to find the length of the history chain
// (across refreshes) for the current room.
function pushOrUpdateHistoryState(history, replace, k, v) {
  let state = {};
  const newLength = ((history.location.state && history.location.state.__historyLength) || 0) + (replace ? 0 : 1);

  if (k) {
    state = history.location.state ? { ...history.location.state } : {};
    delete state.__duplicate;
    state[k] = v;
  }

  const pathname = (history.location.pathname === "/" ? "" : history.location.pathname) + history.location.search;

  // If popToBeginningOfHubHistory was previously used, there is a duplicate entry
  // at the top of the history stack (which was needed to wipe out forward history)
  // so we use this opportunity to replace it.
  const isDuplicate = history.location.state && history.location.state.__duplicate;
  const method = replace || isDuplicate ? history.replace : history.push;
  state.__historyLength = newLength;

  method({ pathname, state });
}

export function replaceHistoryState(history, k, v) {
  pushOrUpdateHistoryState(history, true, k, v);
}

export function pushHistoryState(history, k, v) {
  pushOrUpdateHistoryState(history, false, k, v);
}

export function clearHistoryState(history) {
  pushOrUpdateHistoryState(history, false);
}

// This will pop the browser history to the first entry that was for this hubs room,
// and then push a duplicate entry onto the history stack in order to wipe out forward
// history.
export function popToBeginningOfHubHistory(history, navigateToPriorPage) {
  if (!history.location.state || history.location.state.__historyLength === undefined) return;

  const len = history.location.state.__historyLength;
  if (len === 0) return;

  // After the go() completes, we push a duplicate history entry onto the stack
  // in order to wipe out forward history. We also optionally go back -2 if we wanted
  // to go back to the prior page.
  const unsubscribe = history.listen(() => {
    unsubscribe();
    history.push({
      pathname: history.location.pathname + history.location.search,
      state: { __historyLength: 0, __duplicate: true }
    });
    if (navigateToPriorPage) history.go(-2); // Go back to history entry before beginning.
  });

  history.go(-len);
}

// This will pop the browser history to the entry before the first entry for this hubs room.
export function navigateToPriorPage(history) {
  popToBeginningOfHubHistory(history, true);
}
