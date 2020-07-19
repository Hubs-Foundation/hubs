const qs = new URLSearchParams(location.search);

export default function getHubId() {
	return qs.get("hub_id") ||
    (document.location.pathname === "/" && defaultRoomId
      ? defaultRoomId
      : document.location.pathname.substring(1).split("/")[0]);
}