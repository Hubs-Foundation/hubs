export const releasesLink = "https://github.com/MozillaReality/Spoke/releases/latest";

export function getPlatform() {
  const platform = window.navigator.platform;

  if (["Macintosh", "MacIntel", "MacPPC", "Mac68K"].indexOf(platform) >= 0) {
    return "macos";
  } else if (["Win32", "Win64", "Windows"].indexOf(platform) >= 0) {
    return "win";
  } else if (/Linux/.test(platform) && !/\WAndroid\W/.test(navigator.userAgent)) {
    return "linux";
  }

  return "unsupported";
}

export async function fetchRelease(platform) {
  // Read-only, public access token.
  const token = "de8cbfb4cc0281c7b731c891df431016c29b0ace";
  const response = await fetch("https://api.github.com/graphql", {
    timeout: 5000,
    method: "POST",
    headers: { authorization: `bearer ${token}` },
    body: JSON.stringify({
      query: `
            {
              repository(owner: "mozillareality", name: "spoke") {
                releases(
                  orderBy: { field: CREATED_AT, direction: DESC },
                  first: 5
                ) {
                  nodes {
                    isPrerelease,
                    isDraft,
                    tag { name },
                    releaseAssets(last: 3) {
                      nodes { name, downloadUrl }
                    }
                  },
                  pageInfo { endCursor, hasNextPage }
                }
              }
            }
          `
    })
  });

  let json;

  try {
    json = await response.json();
  } catch (e) {
    const text = await response.text();
    console.log(`JSON error parsing response from ${response.url} "${text}"`, e);
  }

  if (!json || !json.data) {
    return null;
  }

  const releases = json.data.repository.releases;
  const release = releases.nodes.find(release => /*!release.isPrerelease && */ !release.isDraft);

  if (!release) {
    return null;
  }

  const downloadUrl = release.releaseAssets.nodes.find(asset => asset.name.includes(platform)).downloadUrl;

  return {
    downloadUrl,
    version: release.tag.name
  };
}
