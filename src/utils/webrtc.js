import sdp from "sdp";

// See: https://webrtchacks.com/symmetric-nat/
export function isOnSymmetricNat() {
  const candidates = {};
  const conn = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun1.l.google.com:19302" }, { urls: "stun:stun2.l.google.com:19302" }]
  });
  conn.createDataChannel("test-nat");

  return new Promise(res => {
    conn.onicecandidate = function(e) {
      if (e.candidate && e.candidate.candidate.indexOf("srflx") !== -1) {
        const cand = sdp.parseCandidate(e.candidate.candidate);
        if (!candidates[cand.relatedPort]) candidates[cand.relatedPort] = [];
        if (cand.protocol === "udp") {
          candidates[cand.relatedPort].push(cand.port);
        }
      } else if (!e.candidate) {
        if (Object.keys(candidates).length === 1) {
          const ports = candidates[Object.keys(candidates)[0]];
          const isSymmetric = [...new Set(ports)].length > 1;
          console.info(`Symmetric NAT: ${isSymmetric}`);
          res(isSymmetric);
        }
      }
    };
    conn.createOffer().then(offer => conn.setLocalDescription(offer));
  });
}
