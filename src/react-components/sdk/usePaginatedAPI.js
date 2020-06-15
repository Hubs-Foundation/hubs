import { useEffect, useState, useCallback } from "react";

export function usePaginatedAPI(apiCallback) {
  const [state, setState] = useState({
    isLoading: true,
    hasMore: false,
    results: [],
    suggestions: [],
    error: undefined,
    cursor: 0,
    nextCursor: undefined
  });

  useEffect(
    () => {
      setState({
        isLoading: true,
        hasMore: false,
        results: [],
        suggestions: [],
        error: undefined,
        cursor: 0,
        nextCursor: undefined
      });
    },
    [apiCallback]
  );

  const loadMore = useCallback(
    () => {
      if (state.nextCursor && !state.isLoading) {
        setState(curState => ({ ...curState, cursor: curState.nextCursor, nextCursor: undefined }));
      }
    },
    [state.nextCursor, state.isLoading]
  );

  useEffect(
    () => {
      apiCallback(state.cursor)
        .then(response => {
          setState(curState => ({
            ...curState,
            isLoading: false,
            hasMore: !!response.meta.next_cursor,
            results: [...curState.results, ...response.entries],
            suggestions: response.suggestions,
            error: undefined,
            nextCursor: response.meta.next_cursor
          }));
        })
        .catch(error => {
          setState(curState => ({
            ...curState,
            isLoading: false,
            hasMore: false,
            results: curState.results,
            suggestions: [],
            error
          }));
        });

      setState(curState => ({
        ...curState,
        isLoading: true,
        hasMore: false,
        error: undefined
      }));
    },
    [state.cursor, apiCallback]
  );

  return { ...state, loadMore };
}
