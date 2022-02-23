let clientId = "uyelnjz5y4nqd9rgvq8tqucqy1kwa0";
let clientSecret = "sud4l33iyaw3xoy6sdo6otlynsnndj";

function getTwitchAuthorization() {
    let url = `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`;

    return fetch(url, {
    method: "POST",
    })
    .then((res) => res.json())
    .then((data) => {
        return data;
    });
}

export async function getLiveGameStreams() {
    const endpoint = "https://api.twitch.tv/helix/streams?first=7";

    let authorizationObject = await getTwitchAuthorization();
    let { access_token, expires_in, token_type } = authorizationObject;
    
    //token_type first letter must be uppercase    
    token_type =
    token_type.substring(0, 1).toUpperCase() +
    token_type.substring(1, token_type.length);

    let authorization = `${token_type} ${access_token}`;

    let headers = {
    authorization,
    "Client-Id": clientId,
    };

    let printAddress = await fetch(endpoint, {headers,
    })
    .then((res) => res.json())
    .then((dataRows) => {
        var liveStreamUrls = [];
        for (const item of dataRows.data){
        if (!item.is_mature && item.type === "live"){
            liveStreamUrls.push("https://www.twitch.tv/" + item.user_login);
        } 
        }
        return liveStreamUrls;
    });
 
    return printAddress;
}

