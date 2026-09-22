# OpenCode Workflow: Design-to-Implementation

## Overview

This document describes a recommended workflow orchestration pattern for OpenCode that chains multiple skills and agents sequentially, with each phase getting its own fresh context window and ability to navigate between subagent sessions.

Currently, skills are run one at a time manually (grill-me → write-prd → to-tickets → implement). This workflow automates that sequence while maintaining full context switching capability.

## Problem

- Running skills one-by-one is manual and repetitive
- Each skill invocation loses context from previous steps
- No automatic coordination between design, planning, and implementation phases
- Context windows are wasted restarting on each phase

## Solution: Workflow Agent

Create a custom orchestrator agent that:
1. Invokes each skill/subagent sequentially via the Task tool
2. Gives each phase a **fresh, isolated context window**
3. Allows you to **switch between subagent sessions** during execution
4. Maintains workflow state and learnings across phases

## Architecture

```
Parent Session: workflow-prd-to-impl (orchestrator)
  │
  ├─ Child Session 1: grill-me skill
  │   └─ Interview user on feature design
  │
  ├─ Child Session 2: mattpocock-skills-write-a-prd skill
  │   └─ Generate PRD from interview notes
  │
  ├─ Child Session 3: to-tickets skill
  │   └─ Break PRD into tracer-bullet tickets
  │
  └─ Child Session 4: implement skill
      └─ Execute tickets systematically
```

## Workflow Phases

### Phase 1: Design Interview (grill-me)
- **Agent**: grill-me skill
- **Input**: Feature description from user
- **Output**: Locked-in design with decisions documented
- **Context**: Fresh window for relentless questioning

### Phase 2: PRD Generation (mattpocock-skills-write-a-prd)
- **Agent**: mattpocock-skills-write-a-prd skill
- **Input**: Design interview notes
- **Output**: Complete Product Requirements Document
- **Context**: Fresh window, receives interview context as input

### Phase 3: Ticketing (to-tickets)
- **Agent**: to-tickets skill
- **Input**: PRD from Phase 2
- **Output**: Tracer-bullet tickets with blocking edges
- **Context**: Fresh window, receives PRD as input

### Phase 4: Implementation (implement)
- **Agent**: implement skill
- **Input**: Tickets from Phase 3
- **Output**: Implemented feature with tests and documentation
- **Context**: Fresh window, receives tickets as input

## Navigation

When the workflow orchestrator spins up subagents, you can navigate between sessions using OpenCode's multi-session keybinds:

| Keybind | Action |
|---------|--------|
| `<Leader>+Down` | Enter first child session |
| `Right` | Cycle to next child session |
| `Left` | Cycle to previous child session |
| `Up` | Return to parent (orchestrator) session |

### Example Workflow

1. **Start**: Launch workflow agent with feature description
   ```
   @workflow-prd-to-impl Let's build a dark mode toggle for the expense app
   ```

2. **Phase 1 - Interview**: Agent automatically spins up grill-me session
   - Press `<Leader>+Down` to enter that session
   - Relentlessly grill yourself on design decisions
   - Return to parent when done (`Up`)

3. **Phase 2 - PRD**: Orchestrator spins up PRD writer session
   - Press `<Leader>+Down` again to enter it
   - Review/refine the generated PRD
   - Can switch back to Phase 1 with `Left` if needed
   - Return to parent when done

4. **Phase 3 - Tickets**: Continue through ticketing phase
   - Press `Right` to cycle through sessions
   - Each has full context of what came before

5. **Phase 4 - Implement**: Final implementation phase
   - Press `Right` again
   - Watch implementation proceed with fresh context window
   - Can reference any previous phase by pressing `Left`

## Key Benefits

- **Automation**: No manual phase transitions—workflow orchestrator chains them
- **Isolation**: Each phase gets fresh context, preventing confusion/context bleed
- **Flexibility**: Switch between any phase anytime without losing context
- **Traceability**: Full conversation history at each phase
- **Reusability**: Define once, use for any feature
- **Extensibility**: Add/remove phases by modifying the orchestrator

## Implementation

The workflow is implemented as a custom subagent in `.opencode/agents/workflow-prd-to-impl.md`:

```markdown
---
name: workflow-prd-to-impl
description: Orchestrate full design-to-implementation workflow
mode: subagent
permission:
  task: allow
---

You orchestrate a complete feature workflow:

1. **Grill Phase**: Load the grill-me skill to interview the user on the feature design
2. **PRD Phase**: Load the mattpocock-skills-write-a-prd skill to generate a PRD based on the interview
3. **Tickets Phase**: Load the to-tickets skill to break the PRD into tracer-bullet tickets
4. **Implement Phase**: Load the implement skill to execute the tickets

Each phase gets its own context window and task invocation. Between phases, summarize what was learned and pass that context forward to the next phase.

Start by asking what feature the user wants to build.
```

Place in: `.opencode/agents/workflow-prd-to-impl.md` (project-local)
Or in: `~/.config/opencode/agents/workflow-prd-to-impl.md` (global)

## When to Use This Workflow

- **Building new features**: Takes you from vague idea → locked-in design → implementation
- **Planning complex work**: Ensures thorough design before code touches disk
- **Learning projects**: Interview forces you to think through design deeply
- **Team collaboration**: Create a shared artifact (PRD) at each phase
- **Requirement clarity**: Each phase builds on previous decisions

## When NOT to Use

- **Hotfixes**: Too heavyweight for quick bug fixes
- **Trivial changes**: Overkill for comment updates or small refactors
- **Exploratory work**: If you're still figuring out what to build, start simpler
- **One-off scripts**: Use individual skills instead

## Configuration Options

You can customize the workflow agent behavior:

- **Model selection**: Use different models for each phase if desired
- **Temperature**: Grill-me could be lower temperature (focused), implement could be balanced
- **Permissions**: Each subagent inherits parent permissions + skill-specific ones
- **Keybinds**: Customize navigation keys in `opencode.json` if defaults don't suit you

## Future Enhancements

- **Workflow templates**: Different workflows for different scenarios (bug fix, refactor, feature, documentation)
- **Checkpoints**: Save state at each phase, resume from any point
- **Parallel phases**: Some phases could run in parallel (e.g., PRD + research)
- **Rollback**: Easy undo if a phase output is unsatisfactory
- **Metrics**: Track time spent per phase, quality metrics

## See Also

- [OpenCode Agents Documentation](https://opencode.ai/docs/agents)
- [OpenCode Skills Documentation](https://opencode.ai/docs/skills)
- [Multi-session Navigation](https://opencode.ai/docs/agents#usage) (keybinds)
- [Task Tool](https://opencode.ai/docs/tools) (subagent invocation)
