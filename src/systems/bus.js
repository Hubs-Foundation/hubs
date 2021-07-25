export function bus(messages, events) {
  return events.map(event => {
    return m => messages.push([event, m]);
  });
}
