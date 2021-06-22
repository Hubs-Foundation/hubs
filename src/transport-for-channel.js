export function transportForChannel(channel) {
  return (clientId, dataType, data) => {
    if (clientId) {
      channel.push("naf", { clientId, dataType, data });
    } else {
      channel.push("naf", { dataType, data });
    }
  };
}
