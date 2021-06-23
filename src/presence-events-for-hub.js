export function presenceEventsForHub(events, hubId) {
  const onJoin = (key, meta) => {
    events.trigger(`hub:join`, { key, meta });
  };
  const onLeave = (key, meta) => {
    events.trigger(`hub:leave`, { key, meta });
  };
  const onChange = (key, previous, current) => {
    events.trigger(`hub:change`, { key, previous, current });
  };
  return {
    onJoin,
    onLeave,
    onChange
  };
}
