# Mozilla Social Mixed Reality Client

A prototype client demonstrating a multi-user experience in WebVR. Built with
[A-Frame](https://github.com/aframevr/aframe/)

## Getting Started

To run the social client, run:

```sh
git clone https://github.com/mozilla/mr-social-client.git
yarn install
yarn start
```

## Building Static Files

To bundle javascript and generate the html templates, run:

```sh
yarn build
```

### Using CDN Assets

If you are hosting your static assets at separate path from the html documents,
the asset handlebars helper supports rewriting the base asset paths. To use it
run:

```sh
BASE_ASSETS_PATH="https://cdn.mysite.com/assets/" yarn build
```

Ex.

```hbs
<img src="{{asset "asseturl.png"}}"/>
```

Will become:

```html
<img src="https://cdn.mysite.com/assets/asseturl.png?crc=f37a775"/>
```
