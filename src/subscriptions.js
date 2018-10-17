// Manages web push subscriptions
//
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// In local storage: Map of sid -> { endpoint: "<endpoint>" }
// If entry exists, it means there is a subscription to that room, wired to that endpoint.
const LOCAL_STORE_KEY = "___hubs_subscriptions";

export default class Subscriptions {
  constructor(hubId) {
    this.hubId = hubId;
  }

  setHubChannel = hubChannel => {
    this.hubChannel = hubChannel;
  };

  setRegistration = registration => {
    this.registration = registration;
  };

  setVapidPublicKey = vapidPublicKey => {
    this.vapidPublicKey = vapidPublicKey;
  };

  getSubscriptionsFromStorage = () => {
    return JSON.parse(localStorage.getItem(LOCAL_STORE_KEY) || "{}");
  };

  setSubscriptionsToStorage = subscriptions => {
    return localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(subscriptions));
  };

  isSubscribed = () => {
    if (typeof this._isSubscribed === "undefined") {
      this._isSubscribed = !!this.getSubscriptionsFromStorage()[this.hubId];
    }

    return this._isSubscribed;
  };

  toggle = async () => {
    const subscriptions = this.getSubscriptionsFromStorage();

    if (this.isSubscribed()) {
      const endpoint = subscriptions[this.hubId].endpoint;
      this.hubChannel.unsubscribe(endpoint);

      delete subscriptions[this.hubId];

      if (Object.keys(subscriptions).length === 0) {
        this.registration.pushManager.unregister(endpoint);
      }
    } else {
      let subscription = await this.registration.pushManager.getSubscription();

      if (!subscription) {
        const convertedVapidKey = urlBase64ToUint8Array(this.vapidPublicKey);

        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }

      subscriptions[this.hubId] = { endpoint: subscription.endpoint };
      this.hubChannel.subscribe(subscription);
    }

    delete this._isSubscribed;
    this.setSubscriptionsToStorage(subscriptions);
  };
}
