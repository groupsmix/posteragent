# NEXUS - AI Product Creation Platform

> Build, optimize, and publish digital products with AI-powered workflows

## Architecture

```
nexus/
├── apps/
│   ├── nexus-api/          # Main API (Cloudflare Worker + Hono.js)
│   ├── nexus-ai/          # AI Failover Engine (25+ models)
│   └── web/               # Next.js 14 Frontend (shadcn/ui)
├── packages/
│   ├── types/             # Shared TypeScript types
│   └── prompts/           # 8-layer prompt architecture
├── migrations/             # D1 database migrations
└── setup/                 # One-click Cloudflare setup
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, Tailwind CSS, shadcn/ui |
| API | Hono.js, Cloudflare Workers |
| AI | DeepSeek, Claude, Gemini, FLUX, Suno, Tavily |
| Database | Cloudflare D1 (SQLite) |
| Cache | Cloudflare KV |
| Storage | Cloudflare R2 + Images |
| Secrets | Cloudflare Secrets Store |

## Features

- **15-Step AI Workflow**: Market research → Content generation → Platform optimization → Publishing
- **25+ AI Models**: Automatic failover when rate limits hit
- **Multi-Platform**: Etsy, Gumroad, Shopify, Amazon templates
- **Social Media**: Instagram, TikTok, YouTube, Twitter content
- **Trend Radar**: Daily AI-powered trend detection
- **Winner Patterns**: Learn from approved products
- **Graveyard**: Auto-recycle rejected products

## Quick Start

### 1. One-Click Setup (Windows)
```powershell
cd nexus
.\setup\setup.ps1
```

### 2. One-Click Setup (Mac/Linux)
```bash
cd nexus
chmod +x setup/setup.sh
./setup/setup.sh
```

### 3. Manual Setup
```bash
# Login to Cloudflare
wrangler login

# Create infrastructure
wrangler d1 create nexus-db
wrangler kv:namespace create nexus-config
wrangler r2 bucket create nexus-assets

# Run migrations
wrangler d1 execute nexus-db --file=migrations/001_core_schema.sql
wrangler d1 execute nexus-db --file=migrations/002_ai_registry.sql
wrangler d1 execute nexus-db --file=migrations/003_prompt_templates.sql
wrangler d1 execute nexus-db --file=migrations/004_platform_configs.sql
wrangler d1 execute nexus-db --file=migrations/005_social_channels.sql

# Add API keys
wrangler secret put DEEPSEEK_API_KEY --name nexus-api
```

## Development

```bash
# Install dependencies
pnpm install

# Run all apps
pnpm dev

# Or run individually
pnpm --filter nexus-api dev    # API: http://localhost:8787
pnpm --filter nexus-ai dev    # AI Worker: http://localhost:8788
pnpm --filter web dev         # Frontend: http://localhost:3000
```

## Deployment

```bash
# Deploy API
cd apps/nexus-api && wrangler deploy

# Deploy AI Worker
cd apps/nexus-ai && wrangler deploy
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/workflow/start` | Start new workflow |
| GET | `/api/workflow/:id` | Get workflow status |
| GET | `/api/products` | List products |
| GET | `/api/products/:id` | Get product detail |
| POST | `/api/review/:id/approve` | Approve product |
| POST | `/api/review/:id/reject` | Reject product |
| POST | `/api/publish` | Publish to platforms |
| GET | `/api/domains` | List domains |
| GET | `/api/platforms` | List platforms |
| GET | `/api/trends` | Get trend radar |
| GET | `/api/winners` | Get winner patterns |
| GET | `/api/settings` | Get settings |
| PATCH | `/api/settings` | Update settings |

## AI Workflow Steps

1. Market Research
2. Buyer Psychology
3. Keyword Research
4. Content Generation
5. Asset Creation
6. SEO Optimization
7. Title Variants
8. Quality Edit
9. Buyer Simulation
10. Competitor Analysis
11. Humanizer Pass
12. Revenue Estimate
13. Platform Variations
14. Social Content
15. CEO Review

## Configuration

Environment variables (`.env`):
```env
NEXT_PUBLIC_API_URL=https://nexus-api.your-subdomain.workers.dev
```

## License

Private - All rights reserved
