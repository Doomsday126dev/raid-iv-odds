# Free Analytics Options

The app does not load an analytics script by default. That keeps the current build free, simple, and private.

## Recommended Free Option: Cloudflare Web Analytics

Cloudflare Web Analytics is the best free fit for this project because it is privacy-first, does not require changing DNS, and can be added with a JavaScript snippet.

Use this site when adding the property:

```text
doomsday126dev.github.io
```

Do not include `https://` or the `/raid-iv-odds/` project path in the site field.

After Cloudflare gives you a beacon snippet, add it to the `<head>` of `index.html`. It will look similar to this, but the token will be unique to your Cloudflare account:

```html
<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"YOUR_TOKEN"}'></script>
```

If you add Cloudflare's snippet, also update the Content Security Policy in `index.html` to allow Cloudflare's script and event endpoint.

## Privacy Guardrails

Keep analytics limited to page views and broad site usage. Do not send:

- Entered CP values.
- Selected Pokemon.
- IV combinations.
- User identifiers.
- Personal information.

## Other Free-ish Options

- GitHub repository traffic: free, but it is mainly repo traffic and not a full product analytics dashboard for your app.
- GoatCounter: privacy-friendly and donation-supported/free for many personal projects.
- Umami Cloud: currently has a free hobby tier, but plans can change.
