# PixShift

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
│   ├── prd/            # Sharded PRD epics
│   ├── architecture/        # Sharded architecture docs
│   ├── stories/       # User stories
│   └── qa/            # QA documentation
└── README.md           # This file
```

## License

[Add your license here]

