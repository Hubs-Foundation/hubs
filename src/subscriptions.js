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

export default class Subscriptions {
  constructor(hubId, hubChannel, vapidPublicKey, store, registration) {
    this.store = store;
    this.hubId = hubId;
    this.hubChannel = hubChannel;
    this.registration = registration;
    this.vapidPublicKey = vapidPublicKey;
  }

  setVapidPublicKey = vapidPublicKey => {
    this.vapidPublicKey = vapidPublicKey;
  };

  isSubscribed = () => {
    return !!this.store.subscriptions[this.hubId];
  };

  toggle = async () => {
    console.log("toggle");
    const subscriptions = this.store.subscriptions;

    if (this.isSubscribed()) {
      console.log("Send channel unsubscribe");

      delete subscriptions[this.hubId];

      if (Object.keys(subscriptions).length === 0) {
        console.log("Remove push subscription from browser");
      }
    } else {
      console.log("Get current");
      let subscription = await this.registration.pushManager.getSubscription();
      console.log(subscription);

      if (!subscription) {
        const convertedVapidKey = urlBase64ToUint8Array(this.vapidPublicKey);

        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }

      console.log(JSON.stringify(subscription));
      const endpoint = subscription.endpoint;
      subscriptions[this.hubId] = { endpoint };
    }

    this.store.update({ subscriptions });
  };
}
