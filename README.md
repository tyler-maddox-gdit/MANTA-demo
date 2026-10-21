# MANTA-demo

[![Accessibility debt](.manta/badge.svg)](.manta/baseline.json) [![Gate](https://github.com/tyler-maddox-gdit/MANTA-demo/actions/workflows/gate.yml/badge.svg)](https://github.com/tyler-maddox-gdit/MANTA-demo/actions/workflows/gate.yml)

The Benefits Portal, a demonstration site for no real agency, and the story of
[MANTA](https://github.com/tyler-maddox-gdit/MANTA) checking its accessibility across the software lifecycle:
three stages that each stand on their own: the developer's gate on localhost with MANTA's AI skills writing the
fix, the pull request check that blocks new debt while tolerating the committed baseline and posts MANTA's fixes
as a review you can apply, and QA and release in MANTA's Workbench. The first badge is the debt `main`
tolerates; the second is the gate. The presenter's runbook is [DEMO.md](DEMO.md), the script is [SCRIPT.md](SCRIPT.md); the slide is
[presentation/index.html](presentation/index.html).

```
npm ci                                         # the site and MANTA
npm run install-browser-gdit                   # Chromium for MANTA (off GDIT's network: npx manta install-browser)
npm run dev                                    # the site at http://localhost:5173
npx manta gate --base http://localhost:5173    # gate it against .manta/baseline.json
npm run demo -- status                         # is the demo ready?
npm run demo -- stage dev                      # or devops, or qa: set a stage up and print what to type
```

Install Chromium only through MANTA, never `npx playwright install`: another Playwright installs another browser
build and every scan fails with `Executable doesn't exist`. No MANTA clone is needed: `npx manta` and the Workbench
run the MANTA that `npm ci` installed. Setting up a PC to present from, step by step: [SETUP.md](SETUP.md).

To check the committed site store (`sites/http_localhost_4173.json`, the Sign in path) against MANTA's own
readers, run from a MANTA checkout: `npx tsx <this repo>/demo/check-site-store.mjs`.
