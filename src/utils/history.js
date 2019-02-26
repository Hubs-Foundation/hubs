// Utilities for manipulating state history. This provides a number of functions which
// need to be used to manipulate history state so we can deal with edge cases around
// entry back button and refreshes once entered.
//
// These functions also transparently deal with the room slug, so incoming calls can ignore
// dealing with it, and provides APIs for getting the non-slug part of the path.
//
// The slug cannot be part of the basename for history, because the slug changes intra-session
// if the room is renamed.

// This pushes/replaces a new k, v pair into the history, while maintaining all the other
// keys, or clears state if k if null.
//
// Also maintains a length key that can be used to find the length of the history chain
// (across refreshes) for the current room.
function pushOrUpdateHistory(history, replace, k, v, newPathname, newSearch) {
  let state = {};
  const newLength = ((history.location.state && history.location.state.__historyLength) || 0) + (replace ? 0 : 1);

  if (k || newPathname || newSearch) {
    state = history.location.state ? { ...history.location.state } : {};
    delete state.__duplicate;

    if (k) {
      state[k] = v;
    }
  }

  const pathname =
    newPathname !== undefined ? newPathname : history.location.pathname === "/" ? "" : history.location.pathname;

  const search = newSearch !== undefined ? newSearch : history.location.search;

  // If popToBeginningOfHubHistory was previously used, there is a duplicate entry
  // at the top of the history stack (which was needed to wipe out forward history)
  // so we use this opportunity to replace it.
  const isDuplicate = history.location.state && history.location.state.__duplicate;
  const method = replace || isDuplicate ? history.replace : history.push;
  state.__historyLength = newLength;

  method({ pathname, search, state });
}

export function pushHistoryState(history, k, v) {
  pushOrUpdateHistory(history, false, k, v);
}

export function replaceHistoryState(history, k, v) {
  pushOrUpdateHistory(history, true, k, v);
}

export function pushHistoryPath(history, path, search) {
  pushOrUpdateHistory(history, false, null, null, path, search);
}

export function clearHistoryState(history) {
  pushOrUpdateHistory(history, false);
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
      pathname: history.location.pathname,
      search: history.location.search,
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

// Returns the part of the pathname that does not include the slug
export function sluglessPath(location) {
  const parts = location.pathname.split("/");
  return `/${parts.slice(2).join("/")}`;
}

// Returns a new path that includes the current slug as a prefix to the
// provided path.
export function withSlug(location, path) {
  const parts = location.pathname.split("/");
  return `/${parts[1]}${path}`;
}
