import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { DataPanel } from "./DataPanel.js";
import { CollapsiblePanel } from "./CollapsiblePanel.js";
import { MessageButton } from "../input/MessageButton.js";
import styles from "./RtcDebugPanel.scss";

const isMobile = AFRAME.utils.device.isMobile();

const TransportType = {
  SEND: "send_transport",
  RECEIVE: "receive_transport"
};

const StatsType = {
  INBOUND_RTP: "inbound-rtp",
  OUTBOUND_RTP: "outbound-rtp",
  LOCAL_CANDIDATE: "local-candidate",
  REMOTE_CANDIDATE: "remote-candidate",
  CANDIDATE_PAIR: "candidate-pair"
};

const STATS_REFRESH_TIME = 500;
const PRODUCERS_KEY = "producers";
const CONSUMERS_KEY = "consumers";
const MEDIASOUP_DOC_BASE_URL = "https://mediasoup.org/documentation/v3/libmediasoupclient/api/";
const MDN_DOC_BASE_URL = "https://developer.mozilla.org/en-US/docs/Web/API/";

const MessageButtonStyle = {
  width: "auto",
  alignSelf: "center",
  margin: "5px",
  padding: "4px 18px",
  fontSize: "12px",
  minWidth: "120px"
};

export function PanelMessageButton(props) {
  return <MessageButton {...props} style={MessageButtonStyle} />;
}

function TrackStatsPanel({ title, data, xAxis, yAxis, stats }) {
  const props = {
    id: data.id,
    opened: data.opened,
    paused: data.paused,
    kind: data.kind
  };
  return (
    <DataPanel title={`${data?.kind} ${title}`} data={props}>
      {data?.track && <DataPanel key={data.id} data={data.track} title={`track`} />}
      {stats && (
        <DataPanel
          key={stats.rtpStats?.id}
          graphData={stats.graph.slice()}
          width={"120px"}
          height={"50px"}
          color={"green"}
          speed={stats.speed}
          data={stats.rtpStats}
          xAxis={xAxis}
          yAxis={yAxis}
          title={`stats`}
        />
      )}
    </DataPanel>
  );
}

TrackStatsPanel.propTypes = {
  title: PropTypes.string,
  data: PropTypes.object,
  xAxis: PropTypes.string,
  yAxis: PropTypes.string,
  stats: PropTypes.object
};

function TransportPanel({ title, data, candidates, producers, consumers, isButtonEnabled, onRestart }) {
  return (
    <CollapsiblePanel key={title} title={title} border url={`${MEDIASOUP_DOC_BASE_URL}#Transport`} data={data}>
      <PanelMessageButton
        id={"rtcDebugPanel.restartIceButton"}
        onClick={onRestart}
        disabled={!isButtonEnabled}
        primary
      />
      {candidates?.length && (
        <CollapsiblePanel key={`Candidates`} title={`Candidates`} row url={`${MDN_DOC_BASE_URL}RTCIceCandidate`} border>
          {candidates}
        </CollapsiblePanel>
      )}
      {producers?.length && (
        <CollapsiblePanel
          key={`Local producers`}
          title={`Local producers`}
          row
          url={`${MEDIASOUP_DOC_BASE_URL}#Producer`}
          border
        >
          {producers}
        </CollapsiblePanel>
      )}
      {consumers}
    </CollapsiblePanel>
  );
}

TransportPanel.propTypes = {
  candidates: PropTypes.array,
  producers: PropTypes.array,
  consumers: PropTypes.array,
  data: PropTypes.object,
  onRestart: PropTypes.func,
  title: PropTypes.string,
  isButtonEnabled: PropTypes.bool
};

function SignalingPanel({ data, onConnect, onDisconnect }) {
  return (
    <CollapsiblePanel title={"Signaling"} border data={data}>
      <PanelMessageButton
        id={data.connected ? "rtcDebugPanel.disconnectSignalingButton" : "rtcDebugPanel.connectSignalingButton"}
        onClick={() => {
          if (data.connected) {
            onDisconnect();
          } else {
            onConnect();
          }
        }}
        disabled={false}
        primary
      />
    </CollapsiblePanel>
  );
}

SignalingPanel.propTypes = {
  data: PropTypes.object,
  onConnect: PropTypes.func,
  onDisconnect: PropTypes.func
};

export default class RtcDebugPanel extends Component {
  static propTypes = {
    avatarId: PropTypes.string,
    store: PropTypes.object,
    scene: PropTypes.object,
    intl: PropTypes.object,
    presences: PropTypes.object,
    history: PropTypes.object,
    sessionId: PropTypes.string
  };

  constructor() {
    super();

    this.state = {
      log: [],
      collapsed: { Local: false, Log: isMobile, Remote: isMobile }
    };
  }

  componentDidMount() {
    this.props.scene.addEventListener("rtc_event", this.logEvent);
    this.props.store.addEventListener("statechanged", this.storeUpdated);
    this.runStats(true);
  }

  componentWillUnmount() {
    this.props.scene.removeEventListener("rtc_event", this.logEvent);
    this.props.store.removeEventListener("statechanged", this.storeUpdated);
    this.runStats(false);
  }

  logEvent = e => {
    const currentLog = this.state.log.slice(-200) || [];
    currentLog.push(e.detail);
    this.setState({
      log: currentLog
    });
  };

  storeUpdated = () => {
    const showPanel = this.props.store.state.preferences["showRtcDebugPanel"];
    this.setState({ showPanel: showPanel });
  };

  getDeviceData() {
    const result = {};
    const device = NAF.connection.adapter._mediasoupDevice;
    if (device) {
      result["loaded"] = !device._closed ? true : false;
      result["codecs"] = device._recvRtpCapabilities.codecs.map(
        codec => "[" + codec.mimeType + "/" + codec.clockRate + "]"
      );
    }
    return result;
  }

  async getCandidatesData(peer) {
    const result = {};
    const stats = await peer.getStats();
    for (const data of stats.values()) {
      if (data["type"] === StatsType.CANDIDATE_PAIR) {
        const candidatePair = data;
        if (candidatePair && (candidatePair["nominated"] || candidatePair["selected"])) {
          for (const values of stats.values()) {
            if (candidatePair["localCandidateId"] === values["id"]) {
              result[StatsType.LOCAL_CANDIDATE] = values;
            } else if (candidatePair["remoteCandidateId"] === values["id"]) {
              result[StatsType.REMOTE_CANDIDATE] = values;
            }
          }
        }
      }
    }
    return result;
  }

  async getTransportData(type) {
    const result = {};
    let transport;
    if (type === TransportType.SEND) {
      transport = NAF.connection.adapter._sendTransport;
    } else if (type === TransportType.RECEIVE) {
      transport = NAF.connection.adapter._recvTransport;
    }
    const opened = (transport && !transport._closed && true) || false;
    result["opened"] = opened;
    if (transport) {
      result["state"] = transport._connectionState;
      result["id"] = transport._id;
      result[PRODUCERS_KEY] = [];
      result[CONSUMERS_KEY] = [];
      transport._producers.forEach(producer => {
        result[PRODUCERS_KEY].push(this.getProducerConsumerData(producer));
      });
      transport._consumers.forEach(consumer => {
        result[CONSUMERS_KEY].push(this.getProducerConsumerData(consumer));
      });
      opened && (result["candidates"] = await this.getCandidatesData(transport));
    }
    return result;
  }

  profileFromPresence([, data]) {
    const meta = data.metas[data.metas.length - 1];
    return meta.profile;
  }

  profileFromConsumer(consumer) {
    return Object.entries(this.props.presences || {})
      .filter(([k]) => k === consumer._appData.peerId)
      .map(this.profileFromPresence)
      .shift();
  }

  getProducerConsumerData(peer) {
    const result = {};
    result["opened"] = !peer._closed;
    if (peer) {
      const profile = Object.entries(this.props.presences || {})
        .filter(([k]) => k === peer._appData.peerId)
        .map(this.profileFromPresence)
        .shift();
      result["id"] = peer._id;
      result["paused"] = peer._paused;
      result["track"] = this.getTrackData(peer);
      result["kind"] = peer._kind || result["track"].kind;
      result["name"] = profile ? profile.displayName : "N/A";
      result["peerId"] = peer._appData.peerId;
    }
    return result;
  }

  getTrackData(owner) {
    const result = {};
    result["id"] = owner._track.id;
    result["enabled"] = (owner._track !== null && owner._track.enabled && true) || false;
    result["kind"] = owner._track.kind;
    result["muted"] = owner._track.muted;
    result["state"] = owner._track.readyState;
    return result;
  }

  getSignalingData() {
    return { connected: !NAF.connection.adapter._closed };
  }

  async getServerData() {
    return await NAF.connection.adapter.getServerStats();
  }

  async getRtpStatsData(peer, type) {
    const result = {};
    const stats = await peer.getStats();
    for (const data of stats.values()) {
      if (data["type"] === type) {
        return data;
      }
    }
    return result;
  }

  getGraphData(id, stats) {
    let lastStats = this.state.statsData?.[id]?.last;
    const bytesSent = stats?.bytesSent || 0;
    const bytesReceived = stats?.bytesReceived || 0;
    const packetsSent = stats?.packetsSent || 0;
    const packetsReceived = stats?.packetsReceived || 0;
    const timestamp = stats?.timestamp || 0;
    const bytesSentDelta = bytesSent - lastStats?.bytesSent || 0;
    const bytesReceivedDelta = bytesReceived - lastStats?.bytesReceived || 0;
    const packetsSentDelta = packetsSent - lastStats?.packetsSent || 0;
    const packetsReceivedDelta = packetsReceived - lastStats?.packetsReceived || 0;
    const timeDelta = timestamp - lastStats?.timestamp || 0;
    let graphData = this.state.statsData?.[id]?.graph;
    if (!graphData) {
      const data = new Array(20);
      data.fill({
        bytesSent: 0,
        bytesReceived: 0,
        packetsSent: 0,
        packetsReceived: 0,
        timeDelta: 0
      });
      graphData = data;
    }
    graphData.shift();
    graphData.push({
      bytesSent: bytesSentDelta,
      bytesReceived: bytesReceivedDelta,
      packetsSent: packetsSentDelta,
      packetsReceived: packetsReceivedDelta,
      timeDelta: timeDelta
    });
    lastStats = {
      bytesSent,
      bytesReceived,
      packetsSent,
      packetsReceived,
      timestamp
    };
    return {
      lastStats: lastStats,
      graphData: graphData
    };
  }

  /**
   * @param {string} id Peer id.
   * @param {string} key Stats key to use for generating the speed value.
   */
  getPeerSpeed(id, key) {
    let speed = "0.00";
    const graphData = this.state.statsData?.[id]?.graph;
    if (graphData) {
      const lastData = graphData[graphData.length - 1];
      if (lastData) {
        speed = ((lastData[key] / 1024) * (1 / (lastData.timeDelta / 1000)) || 0).toFixed(2);
      }
    }

    return speed;
  }

  /**
   * Starts/stops the execution of a perioding data updating task. Every time this is executed all the debugging panel data is
   * gathered and the component state is updated to reflect the new data.
   * @param {bool} running Sets the running state for this task, true starts the tas, false stops it.
   */
  async runStats(running) {
    if (running && this.state) {
      const taskId = setInterval(() => {
        (async () => {
          try {
            const deviceData = this.getDeviceData();
            const serverData = await this.getServerData();
            const signalingData = this.getSignalingData();

            // Tranports data
            const transportsData = {};
            transportsData[TransportType.SEND] = await this.getTransportData(TransportType.SEND);
            transportsData[TransportType.RECEIVE] = await this.getTransportData(TransportType.RECEIVE);

            // Populate graph, speed and stats data
            const statsData = {};
            if (NAF.connection.adapter._micProducer) {
              const id = NAF.connection.adapter._micProducer.id;
              const peer = NAF.connection.adapter._micProducer;
              const speedData = this.getPeerSpeed(id, "bytesSent");
              const rtpStatsData = await this.getRtpStatsData(peer, StatsType.OUTBOUND_RTP);
              const { lastStats, graphData } = this.getGraphData(id, rtpStatsData);
              statsData[id] = {};
              statsData[id]["speed"] = speedData;
              statsData[id]["graph"] = graphData;
              statsData[id]["last"] = lastStats;
              statsData[id]["rtpStats"] = rtpStatsData;
            }
            if (NAF.connection.adapter._videoProducer) {
              const id = NAF.connection.adapter._videoProducer.id;
              const peer = NAF.connection.adapter._videoProducer;
              const speedData = this.getPeerSpeed(id, "bytesSent");
              const rtpStatsData = await this.getRtpStatsData(peer, StatsType.OUTBOUND_RTP);
              const { lastStats, graphData } = this.getGraphData(id, rtpStatsData);
              statsData[id] = {};
              statsData[id]["speed"] = speedData;
              statsData[id]["graph"] = graphData;
              statsData[id]["last"] = lastStats;
              statsData[id]["rtpStats"] = rtpStatsData;
            }
            for (const consumer of NAF.connection.adapter._consumers) {
              const id = consumer[0];
              const peer = consumer[1];
              const speedData = this.getPeerSpeed(id, "bytesReceived");
              const rtpStatsData = await this.getRtpStatsData(peer, StatsType.INBOUND_RTP);
              const { lastStats, graphData } = this.getGraphData(id, rtpStatsData);
              statsData[id] = {};
              statsData[id]["speed"] = speedData;
              statsData[id]["graph"] = graphData;
              statsData[id]["last"] = lastStats;
              statsData[id]["rtpStats"] = rtpStatsData;
            }

            // Update state
            this.setState({
              signalingData,
              serverData,
              deviceData,
              statsData,
              transportsData
            });
          } catch (e) {
            console.log(`Run Stats error: ${e}`);
          }
        })();
      }, STATS_REFRESH_TIME);
      this.setState({ taskId: taskId });
    } else {
      clearInterval(this.state.taskId);
    }
  }

  restartSendICE = () => {
    NAF.connection.adapter.restartSendICE();
  };

  restartRecvICE = () => {
    NAF.connection.adapter.restartRecvICE();
  };

  connectSignaling = () => {
    NAF.connection.adapter.connect();
  };

  disconnectSignaling = () => {
    NAF.connection.adapter.disconnect();
  };

  colorForLevel = level => {
    switch (level) {
      case "error":
        return "red";
      case "warn":
        return "orange";
      default:
        return "white";
    }
  };

  createLogMsgs = () => {
    const logLines = [];
    this.state.log
      ?.slice()
      .reverse()
      .forEach((log, index) => {
        logLines.push(<span key={index << 2} className={classNames(styles.rtcLogTag)}>{`[${log.tag}] `}</span>);
        logLines.push(
          <span
            key={(index << 2) | 0x01}
            className={classNames(styles.rtcLogMsg)}
            style={{ color: this.colorForLevel(log.level) }}
          >
            {log.msg}
          </span>
        );
        logLines.push(<br key={(index << 2) | 0x02} />);
      });
    return logLines;
  };

  createCandidates(candidates) {
    const components = [];
    if (candidates) {
      candidates[StatsType.LOCAL_CANDIDATE] &&
        components.push(
          <DataPanel
            key={StatsType.LOCAL_CANDIDATE}
            data={candidates[StatsType.LOCAL_CANDIDATE]}
            title={`Local candidate`}
          />
        );
      candidates[StatsType.REMOTE_CANDIDATE] &&
        components.push(
          <DataPanel
            key={StatsType.REMOTE_CANDIDATE}
            data={candidates[StatsType.REMOTE_CANDIDATE]}
            title={`Remote candidate`}
          />
        );
    }
    return components;
  }

  createProducers(producers = [], stats) {
    return producers.map(producer => {
      return (
        <TrackStatsPanel
          key={producer.id}
          title={"producer"}
          data={producer}
          xAxis={"timeDelta"}
          yAxis={"bytesSent"}
          stats={stats[producer.id]}
        />
      );
    });
  }

  createConsumers(consumers, stats) {
    const reducedConsumers =
      consumers?.reduce((map, consumer) => {
        map[consumer.peerId] = map[consumer.peerId] || {};
        map[consumer.peerId]["name"] = consumer.name;
        map[consumer.peerId]["peerId"] = consumer.peerId;
        map[consumer.peerId]["consumers"] = map[consumer.peerId]["consumers"] || [];
        map[consumer.peerId]["consumers"].push(consumer);
        return map;
      }, []) || [];
    const components = [];
    for (const [, reducedConsumer] of Object.entries(reducedConsumers)) {
      const consumerPanels = reducedConsumer.consumers.map(consumer => {
        return (
          <TrackStatsPanel
            key={consumer.id}
            title={"consumer"}
            data={consumer}
            xAxis={"timeDelta"}
            yAxis={"bytesReceived"}
            stats={stats[consumer.id]}
          />
        );
      });
      components.push(
        <CollapsiblePanel
          key={reducedConsumer.name}
          title={reducedConsumer.name}
          url={`${MEDIASOUP_DOC_BASE_URL}#Consumer`}
          data={{ peerId: reducedConsumer.peerId }}
          border
        >
          <CollapsiblePanel row>{consumerPanels}</CollapsiblePanel>
        </CollapsiblePanel>
      );
    }
    return components;
  }

  createRemoteTransports(data) {
    const transports = [];
    if (data) {
      for (const transportId in data) {
        const transport = data[transportId];
        const producers = [];
        if (transport?.producers) {
          for (const producerId in transport.producers) {
            const stats = transport.producers[producerId];
            stats.forEach((stat, index) => {
              producers.push(<DataPanel key={`${producerId}${index}`} data={stat} title={`${stat.kind} stats`} />);
            });
          }
        }
        const consumers = [];
        if (transport?.consumers) {
          for (const consumerId in transport.consumers) {
            const stats = transport.consumers[consumerId];
            stats.forEach((stat, index) => {
              consumers.push(<DataPanel key={`${consumerId}${index}`} data={stat} title={`${stat.kind} stats`} />);
            });
          }
        }
        transports.push(
          <CollapsiblePanel
            key={transportId}
            title={`${transport.name} Transport`}
            url={`${MDN_DOC_BASE_URL}RTCStatsReport`}
            data={{ id: transportId }}
            border
          >
            {producers?.length && (
              <CollapsiblePanel
                key={`producers`}
                title={`Producer Stats`}
                row
                wrap
                url={`${MDN_DOC_BASE_URL}RTCStatsReport`}
                border
              >
                {producers}
              </CollapsiblePanel>
            )}
            {consumers?.length && (
              <CollapsiblePanel
                key={`consumers`}
                title={`Consumer Stats`}
                row
                wrap
                url={`${MDN_DOC_BASE_URL}RTCStatsReport`}
                border
              >
                {consumers}
              </CollapsiblePanel>
            )}
          </CollapsiblePanel>
        );
      }
    }
    return transports;
  }

  onCollapse = (id, isCollapsed) => {
    if (isMobile || window.innerWidth < 500) {
      const collapsed = { ...this.state.collapsed };
      for (const key of Object.keys(collapsed)) {
        if (id === key) {
          collapsed[key] = isCollapsed;
        } else {
          if (!isCollapsed) {
            collapsed[key] = true;
          }
        }
      }
      this.setState({
        collapsed
      });
    }
  };

  render() {
    const { signalingData, serverData, statsData, deviceData, transportsData, collapsed } = this.state;
    const isNarrow = isMobile || window.innerWidth < 500;
    return (
      <div>
        <div className={classNames(styles.rtcDebugPanelRoot)}>
          <div
            className={classNames(styles.rtcStatusContainerLeft)}
            style={{
              height: isNarrow && !collapsed.Local && "80%",
              maxHeight: isNarrow && !collapsed.Local && "80%"
            }}
          >
            <CollapsiblePanel
              title={"Local"}
              isRoot
              border
              grow
              collapsed={collapsed.Local}
              onCollapse={this.onCollapse}
            >
              {deviceData && (
                <CollapsiblePanel title={"Device"} border url={`${MEDIASOUP_DOC_BASE_URL}#Device`} data={deviceData} />
              )}
              {signalingData && (
                <SignalingPanel
                  data={signalingData}
                  onConnect={this.connectSignaling}
                  onDisconnect={this.disconnectSignaling}
                />
              )}
              <div style={{ display: "flex", flexFlow: "column" }}>
                <TransportPanel
                  title={`Send Transport`}
                  data={{
                    id: transportsData?.[TransportType.SEND]?.id,
                    opened: transportsData?.[TransportType.SEND]?.opened,
                    state: transportsData?.[TransportType.SEND]?.state
                  }}
                  candidates={this.createCandidates(transportsData?.[TransportType.SEND]?.candidates)}
                  producers={this.createProducers(transportsData?.[TransportType.SEND]?.producers, statsData)}
                  onRestart={this.restartSendICE}
                  isButtonEnabled={
                    transportsData?.[TransportType.SEND]?.opened &&
                    transportsData?.[TransportType.SEND]?.state === "connected"
                  }
                />
              </div>
              <div style={{ display: "flex", flexFlow: "column" }}>
                <TransportPanel
                  title={`Receive Transport`}
                  data={{
                    id: transportsData?.[TransportType.RECEIVE]?.id,
                    opened: transportsData?.[TransportType.RECEIVE]?.opened,
                    state: transportsData?.[TransportType.RECEIVE]?.state
                  }}
                  consumers={this.createConsumers(transportsData?.[TransportType.RECEIVE]?.consumers, statsData)}
                  onRestart={this.restartRecvICE}
                  isButtonEnabled={
                    transportsData?.[TransportType.RECEIVE]?.opened &&
                    transportsData?.[TransportType.RECEIVE]?.state === "connected"
                  }
                />
              </div>
            </CollapsiblePanel>
          </div>
          <div
            className={classNames(styles.rtcLogContainer)}
            style={{
              height: isNarrow && !collapsed.Log && "80%",
              maxHeight: isNarrow && !collapsed.Log && "80%"
            }}
          >
            <CollapsiblePanel title={"Log"} isRoot border grow collapsed={collapsed.Log} onCollapse={this.onCollapse}>
              <p className={classNames(styles.rtcLogMsgContainer)}>{this.createLogMsgs()}</p>
            </CollapsiblePanel>
          </div>
          <div
            className={classNames(styles.rtcStatusContainerRight)}
            style={{
              height: isNarrow && !collapsed.Remote && "80%",
              maxHeight: isNarrow && !collapsed.Remote && "80%"
            }}
          >
            <CollapsiblePanel
              title={"Remote"}
              isRoot
              border
              grow
              collapsed={collapsed.Remote}
              onCollapse={this.onCollapse}
            >
              {this.createRemoteTransports(serverData)}
            </CollapsiblePanel>
          </div>
        </div>
      </div>
    );
  }
}
