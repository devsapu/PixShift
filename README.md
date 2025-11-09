# PixShift

Image transformation website using Gemini API. Transform your images with AI-powered transformations.

## Features

- 🖼️ Image upload and validation
- ✨ AI-powered image transformations using Gemini API
- 🔐 Multiple authentication methods (Gmail OAuth, Facebook OAuth, SMS OTP)
- 💳 Freemium billing system with payment integration
- 👤 User profiles and usage tracking
- 🛠️ Admin dashboard for management
- 🧹 Automatic image cleanup and deletion

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Styling:** Tailwind CSS
- **Authentication:** NextAuth.js
- **Storage:** AWS S3 or Local filesystem
- **Payment:** Stripe (primary), PayPal (optional)
- **SMS:** Twilio

## Getting Started

### Prerequisites

- Node.js 18+ LTS
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd PixShift
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Health Check

The application includes a health check endpoint:
- **GET** `/api/health` - Returns application health status

## Project Structure

```
PixShift/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── api/          # API routes
│   │   └── (auth)/       # Authentication routes
│   ├── components/       # React components
│   ├── services/         # Business logic services
│   └── utils/            # Utility functions
├── prisma/               # Database schema and migrations
├── config/                # Configuration files (YAML)
├── docs/                  # Project documentation
└── public/                # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `GEMINI_API_KEY` - Gemini API key
- `NEXTAUTH_SECRET` - NextAuth.js secret
- `IMAGE_STORAGE_TYPE` - 's3' or 'local'
- `STRIPE_SECRET_KEY` - Stripe API key (for payments)

## Documentation

📚 **Master Documentation Index:** [docs/INDEX.md](docs/INDEX.md)

- **PRD:** [docs/prd.md](docs/prd.md)
- **Architecture:** [docs/architecture.md](docs/architecture.md)
- **Stories:** [docs/stories/](docs/stories/)
- **Implementation Checklist:** [docs/IMPLEMENTATION_CHECKLIST.md](docs/IMPLEMENTATION_CHECKLIST.md)

## Development

### Code Quality

- TypeScript strict mode enabled
- ESLint configured with TypeScript rules
- Prettier for code formatting

### Testing

```bash
# Run tests (when implemented)
npm test
```

## License

[Add your license here]

---

Project using BMAD Method (Build-Measure-Analyze-Deploy) framework.

## BMAD Method Setup

This project is configured with BMAD Method v4 for AI-driven development.

### Configuration

- **BMAD Core**: `.bmad-core/` directory contains all agents, tasks, templates, and workflows
- **Config**: `.bmad-core/core-config.yaml` contains project-specific configuration
- **Document Structure**: V4 with sharding enabled
  - PRD: `docs/prd.md` (sharded to `docs/prd/`)
  - Architecture: `docs/architecture.md` (sharded to `docs/architecture/`)
  - Stories: `docs/stories/`
  - QA: `docs/qa/`

### Getting Started

1. **IDE Usage** (Cursor, Claude Code, etc.):
   - Use agents with `@agent-name` (e.g., `@bmad-master`, `@dev`, `@pm`)
   - Agents are available in `.bmad-core/agents/`

2. **Web UI Usage**:
   - Upload team bundles to ChatGPT, Claude, or Gemini
   - Use `web-bundles/teams/team-fullstack.txt` for full team access

### Available Agents

- `bmad-master` - Universal expert for all tasks
- `bmad-orchestrator` - Workflow coordination
- `pm` - Product Manager
- `architect` - Solution Architect
- `dev` - Developer
- `qa` - QA Specialist
- `sm` - Scrum Master
- `po` - Product Owner
- `ux-expert` - UX Designer
- `analyst` - Business Analyst

### Workflows

- Greenfield: `greenfield-fullstack.yaml`, `greenfield-service.yaml`, `greenfield-ui.yaml`
- Brownfield: `brownfield-fullstack.yaml`, `brownfield-service.yaml`, `brownfield-ui.yaml`

## Documentation

📚 **Master Documentation Index:** [docs/INDEX.md](docs/INDEX.md) - Complete index of all project documentation

The master index provides:
- Quick navigation to all documents
- Document descriptions and status
- Role-based navigation guides
- Cross-references between documents

## Project Structure

```
PixShift/
├── .bmad-core/          # BMAD Method core files
│   ├── agents/          # AI agent definitions
│   ├── tasks/           # Reusable tasks
│   ├── templates/       # Document templates
│   ├── workflows/       # Workflow definitions
│   └── core-config.yaml # Project configuration
├── docs/                # Project documentation (created during development)
│   ├── INDEX.md        # Master documentation index
│   ├── prd/            # Sharded PRD epics
│   ├── architecture/        # Sharded architecture docs
│   ├── stories/       # User stories (33 stories)
│   └── qa/            # QA documentation
└── README.md           # This file
```

## License

[Add your license here]

