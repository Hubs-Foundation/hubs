export function eventNamesForRoomId(id) {
  const prefix = `room:${id}`;
  return {
    JOIN: `${prefix}:presence:join`,
    LEAVE: `${prefix}:presence:leave`,
    CHANGE: `${prefix}:presence:change`,
    SYNC: `${prefix}:presence:sync`,
    CREATE: `${prefix}:entity:create`,
    UPDATE: `${prefix}:entity:update`,
    DELETE: `${prefix}:entity:delete`
  };
}
