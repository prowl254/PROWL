# PROWL Bot

<p align="center">
  <a href="https://ibb.co/W4m4XYPL">
    <img src="https://i.ibb.co/G4z4Dbtq/Chat-GPT-Image-Oct-2-2026-11-20-31-AM.png" alt="PROWL logo" width="260">
  </a>
</p>

<p align="center"><strong>A powerful WhatsApp bot built for reliable everyday automation.</strong><br>Fast commands, media tools, group utilities, owner controls, games, menus, and persistent sessions.</p>

<p align="center">
  <a href="https://github.com/prowl254/PROWL"><img src="https://img.shields.io/badge/PROWL-private%20source-111815?style=for-the-badge&logo=github&logoColor=white" alt="PROWL source"></a>
  <a href="https://prowl.pairsite.space"><img src="https://img.shields.io/badge/Pair%20Site-Open%20Pairing-75F6A4?style=for-the-badge&logo=whatsapp&logoColor=061109" alt="Open PROWL Pair Site"></a>
  <a href="./deployment/index.html"><img src="https://img.shields.io/badge/deploy-PROWL-75F6A4?style=for-the-badge&logo=rocket&logoColor=061109" alt="Deploy PROWL"></a>
  <a href="https://github.com/peace-amani/prowl-feature-loader/commits/main"><img src="https://img.shields.io/github/last-commit/peace-amani/prowl-feature-loader?style=for-the-badge&color=163c28" alt="Last update"></a>
</p>

> **PROWL** is powered by PROWL technology and designed to stay online, keep its session, and retain its settings after normal server restarts.

## What is PROWL?

PROWL is a feature-rich WhatsApp bot for owners, communities, and groups that need one dependable command center. It combines practical automation with media, utility, entertainment, and administration tools in a single bot.

### Bot capabilities

- **Media and downloads** — music, video, image, stickers, conversion, and media utilities
- **Group management** — moderation, member tools, group settings, and administration commands
- **Automation** — auto-read, auto-view, auto-react, presence, auto-typing, auto-recording, and related controls
- **Owner controls** — bot configuration, menu settings, session management, backups, and diagnostics
- **Games and entertainment** — games, fun commands, image generation, anime tools, and interactive menus
- **Persistent menus** — custom menu image, menu styles, button mode, footer, prefix, and bot mode settings
- **Reliable recovery** — session and configuration state are retained across normal restarts when persistent storage is enabled

## Start using PROWL

You may provide an existing session, but it is optional. If `SESSION_ID` is missing, PROWL starts its system pairing mode instead of exiting:

```env
# Optional: omit this to use the pairing options shown in the bot logs
SESSION_ID=your-session-id
PROWL_PERSISTENT_DIR=/home/container/persistent/prowl
```

Then start the bot with:

```bash
npm install
npm start
```

The bot connects to the configured private feature service automatically during startup. With no `SESSION_ID`, the panel should remain online and show the pairing/system options.

On the first launch, PROWL installs the downloaded bot dependencies automatically. They are stored in the persistent state location and reused on later restarts. A healthy startup includes:

```text
[PROWL] syncing feature from private service
[PROWL] persistent state mounted: .../bot-state
[PROWL] installing feature dependencies ...        # first launch/update
[PROWL] feature dependencies installed
[PROWL] feature synced: .../feature-cache/...
[PROWL] launching extracted feature with persistent state
PROWL // BOOT HANDSHAKE
● BOOT READY  awaiting WhatsApp handshake
◆ 01 → Pairing Code Login     ⟪Recommended⟫
◆ 02 → Clean Session Reset    ⟪Fresh Boot⟫
◆ 03 → ENV Session Injection  ⟪Advanced⟫
```

Later restarts should show `feature dependencies ready (persistent cache)` instead of reinstalling every package.

## Deploy PROWL

Choose a worker platform and follow its storage requirements.

| Platform | Best for | Deploy |
| --- | --- | --- |
| **Railway** | Managed background worker | [![Deploy on Railway](https://img.shields.io/badge/Deploy-Railway-75F6A4?style=for-the-badge&logo=railway&logoColor=061109)](./deployment/index.html#railway) |
| **Render** | Managed worker with disk | [![Deploy on Render](https://img.shields.io/badge/Deploy-Render-75F6A4?style=for-the-badge&logo=render&logoColor=061109)](./deployment/index.html#render) |
| **Heroku** | Procfile-based worker | [![Deploy on Heroku](https://img.shields.io/badge/Deploy-Heroku-75F6A4?style=for-the-badge&logo=heroku&logoColor=061109)](./deployment/index.html#heroku) |
| **Docker** | Portable self-hosting | [![Run with Docker](https://img.shields.io/badge/Run-Docker-75F6A4?style=for-the-badge&logo=docker&logoColor=061109)](./deployment/index.html#docker) |
| **Pterodactyl** | Game/server panels | [![Deploy on Panel](https://img.shields.io/badge/Deploy-Panel-75F6A4?style=for-the-badge&logo=linux&logoColor=061109)](./deployment/index.html#pterodactyl-panel) |

More deployment options are available on the [PROWL deployment page](./deployment/index.html).

> **Important:** The long-running PROWL bot should run on Railway, Render, Heroku, Docker, or a server panel.

## Persistence and restart safety

PROWL stores its runtime state separately from the downloaded feature code. The following data is retained:

- WhatsApp authentication and session files
- Databases under `data/`
- Menu image, menu style, footer, prefix, and bot-mode settings
- Owner and bot configuration
- `.session_id_hash`
- Group and runtime configuration files

The default state layout is:

```text
data/prowl-state/
├── bot-state/       # sessions, databases, settings, and authentication
├── feature-cache/   # refreshed PROWL bot code
└── node_modules/    # cached production dependencies
```

For production, point `PROWL_PERSISTENT_DIR` to a mounted disk or volume:

```env
PROWL_PERSISTENT_DIR=/home/container/persistent/prowl
```

A panel must preserve server files between restarts. If the platform destroys the entire filesystem or recreates the server without its volume, no bot can retain local session data. Never use `/tmp` or a disposable build directory for the persistent path.

## Platform setup

### Railway

- Create a service from this repository.
- Optionally add `SESSION_ID` for automatic session injection; omit it to use pairing mode.
- Attach a persistent volume.
- Set `PROWL_PERSISTENT_DIR` to the volume mount path.
- Start command: `npm start`.

### Render

- Create a **Background Worker**, not a web service.
- Build command: `npm install`.
- Start command: `npm start`.
- Attach a persistent disk.
- Set `PROWL_PERSISTENT_DIR` to the disk mount path.

The repository includes `render.yaml` for this worker setup.

### Heroku

The repository includes `Procfile` and `app.json`:

```text
worker: npm start
```

Heroku's local filesystem is ephemeral. Use an external persistent store or a platform with durable volumes for long-term sessions.

### Docker

```bash
docker build -t prowl-bot .
docker run -d \
  --name prowl-bot \
  --restart unless-stopped \
  --env SESSION_ID="your-session-id" \
  -v prowl-state:/app/data \
  prowl-bot
```

### Pterodactyl panel

- Use Node.js 18 or newer.
- Install command: `npm install`.
- Startup command: `npm start`.
- Optionally add `SESSION_ID` in the Startup Variables section; omit it to use pairing mode.
- Enable server-file preservation or mount a persistent volume.
- Set `PROWL_PERSISTENT_DIR` to the persistent mount path when available.

## Service configuration

The private feature service is configured separately from the bot. Keep its deployment credentials in the service environment and never commit them to this repository. The bot only requires its session ID and persistent storage path at runtime.

## Troubleshooting

### Relay authentication error

If the private feature service rejects the request, confirm that the service is deployed, reachable, and configured with the credentials expected by the production environment. Review the service logs without posting credentials or session data publicly.

### Settings or session reset after restart

- Confirm logs contain `persistent state mounted`.
- Confirm `PROWL_PERSISTENT_DIR` points to a durable disk or volume.
- Confirm the panel preserves server files.
- Do not use `/tmp`, a build folder, or disposable container storage.

### Pairing mode appears

This is expected when `SESSION_ID` is not configured. Keep the server running and follow the pairing/system options printed by the bot. Add `SESSION_ID` later only when you want automatic session injection.

## Production security

Keep all deployment credentials and session data in platform environment variables. Never commit secrets, authentication files, or database credentials to this repository.

Never commit:

- `SESSION_ID`
- deployment credentials
- database credentials
- authentication files

## Repository files

- `index.js` — PROWL runtime entry point
- `package.json` — production dependencies and start command
- `render.yaml` — Render worker configuration
- `railway.json` — Railway configuration
- `Procfile` — Heroku worker configuration
- `Dockerfile` — container deployment
- `deployment/index.html` — platform deployment page

**PROWL — Powered by PROWL.**
