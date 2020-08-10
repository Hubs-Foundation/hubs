const stream_config = `
room-name:
  - artist: dr33m
    title: dr33m-mix
    length: 1:00:00
`

const lineup : Lineup = jsyaml.load(stream_config)

console.log({
  lineup,
})

interface Playing {
  artist: String
  offset: number // seconds
}

const playing = (playlist: Mix[], epoch: number = Date.now()) => {
  const runtime_reducer = (sum, {length}) => sum + length
  const playlist_runtime = playlist.reduce(runtime_reducer, 0)

  console.log({ playlist_runtime })

  let offset = (epoch/1e3) % playlist_runtime // offset into playlist in seconds

  const mix = playlist.find(({length}) => {
    if (offset < length) {
      return true
    } else {
      offset -= length;
      return false
    }
  })

  return {mix, offset}
}

// returns {room-name: [artist-key: time]}
const set_times = (playlist: Mix[], epoch: number = Date.now()) => {
  return epoch;
}

//lineup(lineup)

playing(lineup['room-name'])
