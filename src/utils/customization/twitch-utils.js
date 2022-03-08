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
    const endpoint = "https://api.twitch.tv/helix/streams";

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

    let recommendedStreams = [  "https://www.twitch.tv/tmxk319", 
                                "https://www.twitch.tv/noway4u_sir",
                                "https://www.twitch.tv/lolpacifictw",
                                "https://www.twitch.tv/lol_nemesis",
                                "https://www.twitch.tv/rybsonlol_",
                                "https://www.twitch.tv/nanajam777"  ];

    let printAddress = await fetch(endpoint, {headers,
    })
    .then((res) => res.json())
    .then((dataRows) => {
        var liveStreamUrls = [];
        var liveRecommendedStreamUrls = [];
        for (const item of dataRows.data){
            if (item.type === "live"){
                let liveStreamUrl = "https://www.twitch.tv/" + item.user_login;
                for(const rstream of recommendedStreams){
                    if (liveStreamUrl === rstream){                        
                        liveRecommendedStreamUrls.push(rstream);
                    }
                }
                liveStreamUrls.push("https://www.twitch.tv/" + item.user_login);
            } 
        }
        console.log("################# recommended live: " + liveRecommendedStreamUrls.length)
        return [...liveRecommendedStreamUrls, ...liveStreamUrls];
    });
 
    return printAddress;
}

