# PROWL

<p align="center">
  <img src="https://i.ibb.co/G4z4Dbtq/Chat-GPT-Image-Oct-2-2026-11-20-31-AM.png" alt="PROWL" width="720">
</p>

<p align="center">
  <strong>A powerful, customizable WhatsApp automation bot.</strong>
</p>

<p align="center">
  <a href="https://github.com/prowl254/PROWL"><img src="https://img.shields.io/badge/GitHub-prowl254%2FPROWL-111827?style=for-the-badge&logo=github" alt="PROWL on GitHub"></a>
  <a href="https://prowl.pairsite.space"><img src="https://img.shields.io/badge/Pair%20Device-PROWL-16a34a?style=for-the-badge&logo=whatsapp" alt="Pair PROWL"></a>
</p>

## About PROWL

PROWL is a feature-rich WhatsApp bot built for dependable daily automation. It combines group management, moderation, media utilities, AI tools, status automation, channel tools, persistent settings, and a clean command menu in one extensible Node.js project.

**Powered by PROWL** 🐾

## Highlights

- Session-based WhatsApp authentication using the `PROWL:~` session format
- Group administration and moderation tools
- Auto-reactions, auto-view, channel, and status utilities
- Media downloading and conversion commands
- AI, image, video, and document tools
- Persistent SQLite-based settings with optional cloud database support
- Heroku, Railway, Render, Docker, VPS, and panel deployment support
- Minimal categorized command menu with live system information

## Quick Start

### Requirements

- Node.js 22 or newer
- pnpm or npm
- A valid PROWL session ID

### Install and run

```bash
git clone https://github.com/prowl254/PROWL.git
cd PROWL
pnpm install
pnpm start
```

You can also use the repository's deployment files for supported hosting platforms.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `SESSION_ID` | Yes | WhatsApp session in `PROWL:~<base64>` format. |
| `BOT_NAME` | No | Display name. Defaults to `PROWL`. |
| `BOT_PREFIX` | No | Command prefix. Defaults to `.`. |
| `BOT_MODE` | No | Operating mode. Defaults to `public`. |
| `BOT_TIMEZONE` | No | Timezone used by schedules and system information. |
| `OWNER_NUMBER` | No | Owner number in international format without `+`. |
| `DATABASE_URL` | No | PostgreSQL connection URL for cloud persistence. |
| `MONGODB_URI` | No | MongoDB connection URL for cloud persistence. |

SQLite storage is used when no cloud database URL is configured.

## Pairing

Use the official PROWL pairing page to connect your WhatsApp account:

**[Pair your device with PROWL](https://prowl.pairsite.space)**

## Deployment

The repository includes deployment configuration for common platforms, including Heroku, Railway, Render, Docker, and panel-based servers. For Heroku, the included `app.json` defines the required Node.js process, buildpacks, and environment variables.

## Contributing

Issues, improvements, and pull requests are welcome. Please keep changes focused, preserve the existing command structure, and test the affected command or deployment path before submitting a contribution.

## Repository

The official PROWL repository is:

**https://github.com/prowl254/PROWL**

## License

This project is provided under the MIT License.
