# Plausible Analytics Setup

The app already includes the Plausible script:

```html
<script defer data-domain="doomsday126dev.github.io" src="https://plausible.io/js/script.js"></script>
```

To activate analytics:

1. Sign in to Plausible.
2. Click **+ Add a website**.
3. Enter this domain:

```text
doomsday126dev.github.io
```

Do not include `https://` or the `/raid-iv-odds/` path in the Plausible domain field.

4. Use the default snippet Plausible shows. The app already has the matching script installed.
5. Visit the live app once:

```text
https://doomsday126dev.github.io/raid-iv-odds/
```

6. Check Plausible's realtime dashboard.

## Privacy Guardrails

The app only sends basic page-view analytics and broad event names. It should not send:

- Entered CP values.
- Selected Pokemon.
- IV combinations.
- User identifiers.
- Personal information.

Keep the Plausible dashboard private unless you intentionally want public stats.
