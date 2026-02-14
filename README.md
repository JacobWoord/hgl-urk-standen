# HGL Urk - Biljartscore Standen Viewer

A mobile-first web application for viewing billiards competition standings from biljartscore.nl.

## Features

- 🎱 Real-time standings from biljartscore.nl
- 📱 Mobile-optimized with horizontal scrolling
- 🥇 Top 3 player highlighting with medals
- 📊 All 16 statistics columns visible
- 💾 5-minute caching for fast performance
- 🎨 Professional billiards-themed design

## Installation

```bash
cd ~/.openclaw/workspace/hgl-standen
npm install
```

## Running Locally

```bash
npm start
```

The application will be available at `http://localhost:3000`

## Deployment

This application is ready to deploy to any Node.js hosting platform.

### Railway

1. Create new project on [Railway](https://railway.app)
2. Connect your repository
3. Railway auto-detects Node.js and uses `npm start`
4. No environment variables needed (uses default PORT)

### Render

1. Create new Web Service on [Render](https://render.com)
2. Connect your repository
3. Build Command: `npm install`
4. Start Command: `npm start`
5. No environment variables needed

### Fly.io

1. Install Fly CLI: `brew install flyctl` (macOS) or see [docs](https://fly.io/docs/hands-on/install-flyctl/)
2. Login: `fly auth login`
3. Launch: `fly launch` (follow prompts)
4. Deploy: `fly deploy`

### VPS (DigitalOcean, Linode, etc.)

```bash
# Clone/upload your code
git clone <your-repo>
cd hgl-standen

# Install dependencies
npm install

# Run with PM2 (recommended)
npm install -g pm2
pm2 start server.js --name hgl-standen

# Or run with systemd, docker, etc.
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port for the server |

## Technical Stack

- **Backend:** Node.js + Express
- **Scraping:** Cheerio for HTML parsing
- **HTTP:** node-fetch for requests
- **Frontend:** Vanilla HTML/CSS/JS (no frameworks)
- **Styling:** Google Fonts (Playfair Display + DM Sans)

## API Endpoints

### GET /api/competities

Returns list of all competitions.

**Response:**
```json
[
  { "id": 6963, "naam": "Donderdag Libre 2025-2026" },
  { "id": 6964, "naam": "Vrijdag Libre 2025-2026" }
]
```

### GET /api/standen/:competitieId

Returns standings for a specific competition.

**Response:**
```json
{
  "competitie": "Donderdag Libre 2025-2026",
  "laatstBijgewerkt": "2026-02-14T20:51:00Z",
  "spelers": [
    {
      "pos": 1,
      "naam": "Riekelt de Vries",
      "handicap": 43,
      "wed": 18,
      "w": 13,
      "g": 0,
      "v": 5,
      "pnt": 26,
      "hs": 20,
      "kp": 23,
      "moyo": 1.72,
      "moyn": 1.402,
      "car": "95.31%",
      "omh": "81.5%",
      "roc": 3,
      "rop": 1,
      "rot": 4
    }
  ]
}
```

## Features Explained

### Sticky Columns
The first two columns (Position and Player Name) remain fixed when scrolling horizontally on mobile devices.

### Top 3 Highlighting
- 🥇 Gold tint for 1st place
- 🥈 Silver tint for 2nd place
- 🥉 Bronze tint for 3rd place

### Column Tooltips
Hover (desktop) or tap (mobile) on column headers to see full descriptions:
- **pos** = Positie
- **wed** = Wedstrijden gespeeld
- **pnt** = Punten (highlighted in bold)
- And 13 more statistics...

### Caching
Standings are cached for 5 minutes to reduce server load and improve performance.

## Data Source

All data is scraped from [biljartscore.nl](https://www.biljartscore.nl/hetgroenelaken/standen) with proper user-agent headers and respectful caching.

## License

MIT
