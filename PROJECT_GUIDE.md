# PixShift - Image Transformation Website Guide

## Project Overview

Create a website that allows users to:
1. Upload personal images
2. Select transformation types (person wearing crown, delivering speech, doing gym, etc.)
3. Use Gemini API to transform images
4. Download the converted images

## Step-by-Step Development Guide

### Phase 1: Planning (Use Web UI - Recommended for Cost Efficiency)

#### Option A: Use Gemini Web UI (Recommended - Cheapest for Large Documents)

1. **Go to**: https://gemini.google.com
2. **Create a new Gem** or use existing chat
3. **Upload the team bundle**:
   - Copy content from `web-bundles/teams/team-fullstack.txt`
   - Paste into Gemini with instruction: "Your critical operating instructions are attached, do not break character as directed"
4. **Create PRD**:
   ```
   I want to create a website called PixShift that allows users to upload personal images and transform them using Gemini API. The website should:
   - Allow users to upload images
   - Provide transformation types like: person wearing crown, person delivering speech, person doing gym, etc.
   - Use Gemini API to transform images
   - Allow users to download converted images
   
   Please create a comprehensive PRD using *create-doc prd
   ```

#### Option B: Use Cursor IDE (Current Environment)

**In Cursor, start a new chat and use BMAD agents:**

1. **Create PRD**:
   - Type: `@pm` to activate Product Manager agent
   - Then type: `*create-doc prd`
   - Follow the interactive prompts to create your PRD

### Phase 2: Architecture (After PRD is Complete)

**In Cursor:**
1. Type: `@architect` to activate Architect agent
2. Type: `*create-doc architecture`
3. The architect will use your PRD to create the technical architecture

### Phase 3: Development Setup

**Run these commands in your terminal (from project root):**

```bash
# Navigate to project root (you're already here)
cd /Users/sapumalthepulangoda/Documents/Workspace/PixShift

# Create project structure
mkdir -p src/{components,pages,utils,services}
mkdir -p public
mkdir -p docs/{prd,architecture,stories,qa}

# Initialize Node.js project (if not already done)
npm init -y

# Install dependencies for a React/Next.js project
npm install next react react-dom
npm install @google/generative-ai
npm install --save-dev typescript @types/react @types/node
```

### Phase 4: Development Workflow

**After PRD and Architecture are created:**

1. **Shard Documents** (Break into manageable pieces):
   - Type: `@bmad-master` in Cursor
   - Type: `*shard-doc docs/prd.md prd`
   - Type: `*shard-doc docs/architecture.md architecture`

2. **Create User Stories**:
   - Type: `@sm` (Scrum Master)
   - Type: `*create` (Creates next story from sharded docs)

3. **Implement Stories**:
   - Type: `@dev` (Developer)
   - Implement the approved story
   - Dev agent will create files and implement features

4. **QA Review**:
   - Type: `@qa` (QA Specialist)
   - Type: `*review-story` (Reviews completed story)

## Quick Start Commands

### Where to Run Commands:

1. **Terminal Commands**: Run in terminal at project root
   ```bash
   cd /Users/sapumalthepulangoda/Documents/Workspace/PixShift
   ```

2. **BMAD Agent Commands**: Run in Cursor chat (new chat for each agent)
   - Use `@agent-name` to activate agents
   - Use `*command` to execute tasks

### Essential Commands:

```bash
# Terminal - Project Setup
npm init -y
npm install next react react-dom @google/generative-ai

# Terminal - Create folders
mkdir -p src/{components,pages,utils,services} public docs/{prd,architecture,stories,qa}

# Cursor Chat - Create PRD
@pm
*create-doc prd

# Cursor Chat - Create Architecture
@architect
*create-doc architecture

# Cursor Chat - Shard Documents
@bmad-master
*shard-doc docs/prd.md prd
*shard-doc docs/architecture.md architecture

# Cursor Chat - Create Stories
@sm
*create

# Cursor Chat - Implement
@dev
[Follow prompts to implement story]

# Cursor Chat - QA Review
@qa
*review-story
```

## Project Structure (After Setup)

```
PixShift/
├── .bmad-core/          # BMAD configuration (already exists)
├── docs/                # Project documentation
│   ├── prd.md          # Product Requirements (to be created)
│   ├── prd/            # Sharded PRD sections
│   ├── architecture.md # Architecture doc (to be created)
│   ├── architecture/   # Sharded architecture sections
│   ├── stories/        # User stories (created during dev)
│   └── qa/             # QA documentation
├── src/                # Source code (to be created)
│   ├── components/     # React components
│   ├── pages/          # Next.js pages
│   ├── utils/          # Utility functions
│   └── services/       # API services (Gemini integration)
├── public/             # Static assets
├── package.json        # Dependencies (to be created)
└── README.md           # Project readme
```

## Next Steps

1. **Start with PRD**: Use `@pm` agent to create Product Requirements Document
2. **Create Architecture**: Use `@architect` agent after PRD is done
3. **Set up project**: Run npm commands above
4. **Start development**: Follow SM → Dev → QA cycle

## Important Notes

- **Always start new chat** when switching between agents (SM, Dev, QA)
- **Use web UI** (Gemini) for planning phase to save costs
- **Use IDE** (Cursor) for development phase
- **One story at a time** - complete each story before starting next

