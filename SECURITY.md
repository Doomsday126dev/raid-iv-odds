# Security Policy

Raid IV Odds is a static, client-side calculator. It does not have user accounts, a backend server, a database, payment handling, or secrets in the browser app.

## Production Access

- Public visitors can use the hosted app, but cannot edit the live site.
- Public GitHub users may fork the repository or open pull requests. Those changes do not affect the live app unless the repository owner reviews, merges, and deploys them.
- Keep direct write access limited to trusted collaborators.
- In GitHub repository settings, enable branch protection for `main` before inviting collaborators:
  - Require pull requests before merging.
  - Require status checks to pass before merging.
  - Do not allow force pushes.
  - Do not allow deletions.

## Data And Privacy

- Calculator inputs are processed in the browser.
- The app does not ask for login credentials or personal information.
- Local display preferences can be stored in the visitor's browser.
- Analytics should remain cookie-free and should not include entered CP values, selected Pokemon, IV spreads, or other calculator inputs.

## Reporting Issues

If you find a security or privacy issue, please report it privately to the repository owner instead of opening a public issue with exploit details.

Useful details to include:

- A short description of the issue.
- Steps to reproduce.
- Browser/device details.
- Whether the issue affects the hosted app, the repository, or both.

## Scope

In scope:

- Hosted app behavior.
- PWA/service-worker behavior.
- Privacy leaks from analytics or URLs.
- Repository workflow or deployment risks.

Out of scope:

- Pokemon GO game mechanics, account security, or raid availability.
- Third-party platform outages or bugs in GitHub Pages, GitHub Actions, or Plausible.
