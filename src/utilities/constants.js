const expireCookies = 7;

// const API_ROOT = "http://localhost:7500";
// const ENV = "http://localhost:7500";
// const APP_ROOT = "https://hubs.local:8080";

const API_ROOT = "https://api.larchiveum.link";
const ENV = "https://api.larchiveum.link";
const APP_ROOT = "https://larchiveum.link";



const naverApp = {
  clientID: "pSh1Vk5d8Df3XZAURRC5",
  appSecret: "D0izmHYDqf"
};

const kakaoApp = {
  clientID: "652860",
  jsKey: "35ee404cd4d922e351cddaedcd7e51ff"
};

const facebookApp = {
  //clientID: '339289624917102',
  clientID: "573470851047401"
};

// WETOP
// const googleApp = {
//     clientID: "58132589047-m5tdln5da7dho7gb7mnp7kqitdnv5dvq.apps.googleusercontent.com",
//     clientSecret: "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"
// }

const googleApp = {
  clientID: "58132589047-k1el1pt544kf47oc1pgqsr6qa1st887u.apps.googleusercontent.com",
  clientSecret: "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"
};

export { expireCookies, naverApp, kakaoApp, facebookApp, googleApp, API_ROOT, APP_ROOT, ENV };
