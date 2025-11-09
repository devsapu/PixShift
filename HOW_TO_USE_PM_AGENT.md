# How to Refine PRD with PM Agent

## Step-by-Step Instructions

### Step 1: Open New Chat in Cursor

1. In Cursor, click the **"+"** button or press `Cmd+L` (Mac) / `Ctrl+L` (Windows) to start a new chat
2. **Important**: Start a fresh chat for the PM agent

### Step 2: Activate PM Agent

Type exactly this in the new chat:

```
@pm
```

This will activate the Product Manager agent. You should see the agent respond acknowledging it's in PM mode.

### Step 3: Start PRD Creation/Refinement

After the PM agent is activated, type:

```
*create-doc prd
```

The PM agent will:
1. Ask if you want to use the existing PRD at `docs/prd.md` or create a new one
2. Guide you through each section interactively
3. Present options 1-9 for elicitation (refinement methods) after each section
4. Allow you to refine and improve the PRD

### Step 4: Follow the Interactive Process

The PM agent will:
- Present each section of the PRD
- Explain the rationale and decisions
- Offer 9 options (1-9) for refinement:
  - **Option 1**: Proceed to next section
  - **Options 2-9**: Various elicitation methods (critique, expand, risk analysis, etc.)
- Wait for your input before proceeding

### Step 5: Refine Each Section

For each section, you can:
- Type **1** to proceed to the next section
- Type **2-9** to apply a refinement method
- Type your own feedback or questions
- Ask for specific changes

### Example Interaction Flow

```
You: @pm
PM Agent: [Activates and introduces itself]

You: *create-doc prd
PM Agent: I see you have an existing PRD at docs/prd.md. Would you like to:
1. Use and refine the existing PRD
2. Create a new PRD from scratch

You: 1
PM Agent: [Loads existing PRD and starts with Goals section]

PM Agent: [Presents Goals section with rationale]

PM Agent: **Advanced Elicitation Options**
Choose a number (0-8) or 9 to proceed:
0. Expand or Contract for Audience
1. Critique and Refine
2. Identify Potential Risks
...
9. Proceed / No Further Actions

You: [Select option or provide feedback]
```

## Tips for PRD Refinement

1. **Be Specific**: When the PM agent asks questions, provide detailed answers
2. **Use Elicitation Methods**: Options 2-9 help you think through different aspects
3. **Review Each Section**: Don't rush - take time to refine each section
4. **Ask Questions**: The PM agent can help clarify requirements
5. **Save Progress**: The PM agent will save to `docs/prd.md` as you go

## What to Focus On

When refining, consider:
- **Clarity**: Are requirements clear and specific?
- **Completeness**: Are all features covered?
- **Feasibility**: Can this be built with Gemini API?
- **User Experience**: Is the flow intuitive?
- **Technical Constraints**: Are there any limitations?

## After PRD is Complete

Once you're satisfied with the PRD:
1. The PM agent will save it to `docs/prd.md`
2. You can then move to Architecture: `@architect` → `*create-doc architecture`
3. Or start development setup

## Troubleshooting

**If `@pm` doesn't work:**
- Make sure you're in Cursor (not another IDE)
- Check that `.bmad-core/` directory exists
- Try typing the full path: `@.bmad-core/agents/pm`

**If `*create-doc prd` doesn't work:**
- Make sure PM agent is activated first
- Check that you're using `*` prefix (asterisk)
- The command should be exactly: `*create-doc prd`

## Quick Reference

```
New Chat → @pm → *create-doc prd → Follow prompts → Refine sections → Save
```

