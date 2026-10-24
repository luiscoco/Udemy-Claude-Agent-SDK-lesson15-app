# Claude Agent SDK · Lesson 15 · CLAUDE.md and project rules

Based on Lesson15_CLAUDE_md_and_Project_Rules.pptx. Five linked web pages, large text, formatted answers and 13 source-linked UML steps.

## What you will learn

- Write lasting project knowledge: Use CLAUDE.md for conventions, architecture, build/test commands and compact summary guidance. Keep one-off task instructions in the task prompt.
- Load the right source: project loads project/parent CLAUDE.md and rules; user loads personal instructions and rules; local loads CLAUDE.local.md. Omission and an explicit empty list are distinct.
- Combine non-conflicting layers: Loaded instruction layers are additive. This lab uses different marker lines so students can observe compliance without inventing a universal precedence ladder.
- Discover child instructions on demand: The child experiment reads feature/data.md while the working directory remains the project root. Observe whether the child CLAUDE.md instruction appears after that Read.
- Observe real compaction: The compaction mode creates one owned persisted session, sends /compact, observes compact_boundary, then resumes the same session and checks the actual answer. Continued compliance is not a wire-level proof of reinjection.
- Separate instructions from permissions: CLAUDE.md works with custom and preset system prompts as conversation context. A host Read guard independently limits tools to classroom data files. Markers describe model compliance, not a complete instruction audit.

## Configure and run

```powershell
git clone https://github.com/luiscoco/Udemy-Claude-Agent-SDK-lesson15-app.git
cd .\Udemy-Claude-Agent-SDK-lesson15-app
npm ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
npm start
```

From presentations, use `cd .\agent-sdk\lesson15-project-rules` instead of cloning. Open http://127.0.0.1:3115 and keep the terminal running. Node.js 24+ and model access are required.

## Create your .env file

Preserve an existing file or copy .env.example. Enter your key locally; do not commit it. Restart after edits. Shell values take precedence over the optional file loaded by npm start.

```dotenv
ANTHROPIC_API_KEY=your_api_key
CLAUDE_MODEL=claude-sonnet-4-6
PORT=3115
# Windows if required: CLAUDE_CODE_GIT_BASH_PATH=C:/Program Files/Git/bin/bash.exe
```

On Windows, set the Git Bash path if needed. Keep optional npm dependencies enabled. A second start recognizes this app; change PORT if another service occupies it.

## Run the experiments

1. Combine additive locations: Run User + project with a custom prompt. Then run omitted defaults and compare the local marker as well. These non-conflicting fixtures do not prove a universal precedence order.
2. Test disabled and child instructions: Run the disable flag case. Then read feature/data.md in the child experiment and compare the observed child rule marker.
3. Observe compaction in the same session: Run Summary → compact → recall. Wait for the entire three-phase experiment. Verify an actual boundary and matching session IDs, then inspect the final returned markers.

```powershell
npm run sample:env -- project
npm run sample:env -- none
npm run sample:env -- combined --custom
npm run sample:env -- compact
npm test
```

`sample` uses only the launching shell environment; `sample:env` loads the optional file. All queries are real and read-only. Prompt and context are fixed classroom choices, not arbitrary browser-supplied source paths.

## How the app was built

### 1. Validate the chosen experiment

Only listed source experiments and a boolean custom-prompt choice are accepted. The browser cannot submit arbitrary paths or instruction text.

Source: `src/agent.ts`, lines 90–90. Selected excerpt.

```typescript
config=validateConfig(config);const runId=randomUUID();
```

### 2. Resolve owned instruction locations

Each run gets an owned parent/project tree plus private home and SDK configuration paths. These classroom directories are not an OS sandbox.

Source: `src/agent.ts`, lines 28–29. Selected excerpt.

```typescript
return { parent: resolve(root, "organization"), cwd: resolve(root, "organization/project"),
    home: resolve(root, "home"), sdkHome: resolve(root, "sdk-home") };
```

### 3. Write project, parent and personal fixtures

The host writes non-conflicting CLAUDE.md and rule files. Their contents are visible to students but are not copied into the task prompt.

Source: `src/agent.ts`, lines 44–44. Selected excerpt.

```typescript
for (const file of files) await writeFile(file.path, file.contents);
```

### 4. Select the intended filesystem sources

Omission preserves runtime defaults. An empty list skips user/project/local sources. Named arrays enable only the selected levels.

Source: `src/agent.ts`, lines 21–24. Selected excerpt.

```typescript
if (mode === "defaults") return undefined;
  if (mode === "none") return [];
  if (mode === "combined") return ["user", "project"];
  return ["project"];
```

### 5. Disable CLAUDE.md independently

The disable environment flag is independent of the selected project source. The actual result remains an observation of this pinned runtime.

Source: `src/agent.ts`, lines 62–62. Selected excerpt.

```typescript
...(config.mode === "disabled" ? {CLAUDE_CODE_DISABLE_CLAUDE_MDS:"1"} : {})},
```

### 6. Keep system prompt and project memory separate

The custom and preset forms are application roles. CLAUDE.md and rules are separate conversation context loaded through settingSources.

Source: `src/agent.ts`, lines 64–64. Selected excerpt.

```typescript
systemPrompt: config.custom
```

### 7. Guard model tool reads

The host permits only the exact owned data files. Model tools cannot Read instruction files to imitate implicit loading.

Source: `src/agent.ts`, lines 53–53. Selected excerpt.

```typescript
return ["data.md", "feature/data.md"].some(file => candidate === resolve(cwd,file).toLowerCase());
```

### 8. Choose root data or child data

The child task reads feature/data.md while cwd remains the project root. That file access can trigger on-demand child instructions.

Source: `src/agent.ts`, lines 100–100. Selected excerpt.

```typescript
: config.mode === "child" ? PROMPTS.task.replace("Read data.md","Read feature/data.md")
```

### 9. Start or resume the owned query

Only the session ID observed inside this run can be resumed. The browser cannot attach to an arbitrary remote session.

Source: `src/agent.ts`, lines 102–102. Selected excerpt.

```typescript
const run = query({prompt,options:{...options,...(sessionId ? {resume:sessionId} : {})}});
```

### 10. Preserve session identity across phases

Summary, compaction and recall retain the same observed session identity. A mismatch is an error rather than a hidden fresh query.

Source: `src/agent.ts`, lines 108–108. Selected excerpt.

```typescript
if (sessionId && message.session_id !== sessionId) throw new Error("Owned session identity changed unexpectedly.");
```

### 11. Observe a real compaction boundary

A system compact_boundary message records actual compaction. Continued instruction compliance is checked in the following real query; this is not a wire-level prompt capture.

Source: `src/agent.ts`, lines 113–114. Selected excerpt.

```typescript
compactBoundaries++;
          emit({type:"boundary",trigger:message.compact_metadata.trigger,preTokens:message.compact_metadata.pre_tokens});
```

### 12. Keep actual final markers and phase outcomes

Extract markers from actual SDK text and retain phase outcomes. Missing compliance is never replaced with an expected answer.

Source: `src/agent.ts`, lines 123–123. Selected excerpt.

```typescript
phases.push({phase,status,markers:MARKERS.filter(m=>text.includes(m))});
```

### 13. Format the answer and expose safe fixture contents

The browser renders sanitized Markdown. Instruction files are shown separately as plain, readable text for students.

Source: `src/client.ts`, lines 18–18. Selected excerpt.

```typescript
if (e.type === "answer") renderMarkdown($("answer"), e.text);
```

## Reference topics and limits

- Seven load locations: Project root CLAUDE.md or .claude/CLAUDE.md; project rules and parent rules; parent CLAUDE.md; child CLAUDE.md on demand; local CLAUDE.local.md; private user CLAUDE.md; and user rules. This lab creates all seven categories, not every alternative file spelling.
- Additive instructions: All selected layers can appear together. Avoid conflicts or state intended precedence explicitly in your own project text. This lab uses independent marker lines rather than conflicting language or package-manager rules.
- Compaction and limits: Project-root CLAUDE.md is re-read after compaction. Nested instruction files and path-scoped rules must load again on demand. The live exercise observes a real boundary and subsequent compliance, not the full provider request payload. Keep files lean; caching and perfect model compliance are not guaranteed.
- What belongs in CLAUDE.md: Repository conventions, architecture, build/test commands, lasting constraints and focused summary guidance. Write task-specific requests in user input and application-specific persona instructions in systemPrompt.
- Configuration boundaries: The app uses private config/home paths, disables auto memory and connector discovery, and configures strict MCP. settingSources is not an OS sandbox and does not remove managed policy. Local personal notes should remain uncommitted.

The app never exposes the expanded internal prompt or inherited environment. Marker flags describe actual text, not complete instruction audits. Private classroom directories are not an OS sandbox. Media, .env, dependencies and runtime files are excluded from Git.

## References

- [Project memory and compaction](https://code.claude.com/docs/en/memory)
- [Official filesystem features guide](https://code.claude.com/docs/en/agent-sdk/modifying-project-rules)
- [TypeScript SDK reference](https://code.claude.com/docs/en/agent-sdk/typescript)

Regenerate student pages with `python scripts/build-pages.py`.
