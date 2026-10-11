# MANTA-demo

[![Accessibility debt](.manta/badge.svg)](.manta/baseline.json) [![Gate](https://github.com/tyler-maddox-gdit/MANTA-demo/actions/workflows/gate.yml/badge.svg)](https://github.com/tyler-maddox-gdit/MANTA-demo/actions/workflows/gate.yml)

The Benefits Portal, a demonstration site for no real agency, and the story of
[MANTA](https://github.com/tyler-maddox-gdit/MANTA) checking its accessibility across the software lifecycle:
a developer's gate on localhost, a pull request check that blocks new debt while tolerating the committed
baseline, a nightly scan through the sign-in, and QA and release in MANTA's Workbench. The first badge is the
debt `main` tolerates; the second is the gate. The presenter's runbook is [DEMO.md](DEMO.md).

```
npm run dev                                    # the site at http://localhost:5173
npx manta gate --base http://localhost:5173    # gate it against .manta/baseline.json
npm run demo -- status                         # is the demo ready?
```

To check the committed site store (`sites/http_localhost_4173.json`, the Sign in path) against MANTA's own
readers, run from a MANTA checkout: `npx tsx <this repo>/demo/check-site-store.mjs`.
