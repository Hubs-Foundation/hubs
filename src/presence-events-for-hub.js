export function presenceEventsForHub(events, hubId) {
  const onJoin = (key, meta) => {
    events.trigger(`hub:${hubId}:join`, { key, meta });
  };
  const onLeave = (key, meta) => {
    events.trigger(`hub:${hubId}:leave`, { key, meta });
  };
  const onChange = (key, previous, current) => {
    events.trigger(`hub:${hubId}:change`, { key, previous, current });
  };
  return {
    onJoin,
    onLeave,
    onChange
  };
}
