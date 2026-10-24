import { query, type Options, type SettingSource } from "@anthropic-ai/claude-agent-sdk";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, basename, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import type { RunConfig, Mode, LabEvent } from "./protocol.js";
export type { RunConfig, LabEvent } from "./protocol.js";
export const ROOT = fileURLToPath(new URL("../", import.meta.url));
export const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-6";
export const DEFAULT_CONFIG: RunConfig = { mode: "project", custom: false };
export const MODES: Mode[] = ["project", "none", "combined", "defaults", "disabled", "child", "compact"];
export const MARKERS = ["PARENT-RULE-15", "PROJECT-RULE-15", "API-RULE-15", "USER-RULE-15", "USER-PREF-15", "LOCAL-RULE-15", "CHILD-RULE-15"];
export const PROMPTS = { task: 'Read data.md, then summarize the project facts in two short bullets. Include every exact response marker specified by instructions already loaded into your context. Do not invent markers, read instruction files or run commands. Never claim you ran tests.' };
export function validateConfig(value: unknown): RunConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Send a project-rules configuration.");
  const v = value as RunConfig;
  if (!MODES.includes(v.mode) || typeof v.custom !== "boolean") throw new Error("Choose a listed mode and boolean custom-prompt setting.");
  return { mode: v.mode, custom: v.custom };
}
export function sourceSelection(mode: Mode): SettingSource[] | undefined {
  if (mode === "defaults") return undefined;
  if (mode === "none") return [];
  if (mode === "combined") return ["user", "project"];
  return ["project"];
}
export function directories(config: RunConfig, runId: string) {
  const root = resolve(ROOT, ".runtime", config.mode, runId);
  return { parent: resolve(root, "organization"), cwd: resolve(root, "organization/project"),
    home: resolve(root, "home"), sdkHome: resolve(root, "sdk-home") };
}
export async function prepareWorkspace(config: RunConfig, runId: string) {
  const d = directories(config, runId);
  for (const path of [d.parent, d.cwd, d.home, d.sdkHome, resolve(d.cwd, ".claude/rules"), resolve(d.sdkHome, "rules"), resolve(d.cwd, "feature")]) await mkdir(path, {recursive:true});
  const rule = (marker:string) => `# Classroom response rule\nInclude the exact line ${marker} once in every classroom summary. Do not read instruction files with tools.\n`;
  const files = [
    {name:"parent/CLAUDE.md",path:resolve(d.parent,"CLAUDE.md"),contents:rule(MARKERS[0])},
    {name:"project/CLAUDE.md",path:resolve(d.cwd,"CLAUDE.md"),contents:rule(MARKERS[1])+"\nConventions: TypeScript; descriptive names.\nArchitecture: src contains host code; public contains browser assets.\nCommands: npm test (reference; never claim execution in this read-only lab).\nSummary instructions: preserve project facts and applicable response rules during compaction.\n"},
    {name:"project/.claude/rules/api.md",path:resolve(d.cwd,".claude/rules/api.md"),contents:rule(MARKERS[2])},
    {name:"private-user/CLAUDE.md",path:resolve(d.sdkHome,"CLAUDE.md"),contents:rule(MARKERS[3])},
    {name:"private-user/rules/preferences.md",path:resolve(d.sdkHome,"rules/preferences.md"),contents:rule(MARKERS[4])},
    {name:"project/CLAUDE.local.md",path:resolve(d.cwd,"CLAUDE.local.md"),contents:rule(MARKERS[5])},
    {name:"project/feature/CLAUDE.md",path:resolve(d.cwd,"feature/CLAUDE.md"),contents:rule(MARKERS[6])},
  ];
  for (const file of files) await writeFile(file.path, file.contents);
  const data = '# Project facts\nThe classroom API serves a read-only catalogue.\nThe browser requests data through a TypeScript host.\n';
  await writeFile(resolve(d.cwd,"data.md"),data);
  await writeFile(resolve(d.cwd,"feature/data.md"),data+'The feature directory adds catalogue filters.\n');
  return files.map(({name,contents}) => ({name,contents}));
}
export function readAllowed(cwd: string, name: string, input: Record<string, unknown>) {
  if (name !== "Read" || typeof input.file_path !== "string") return false;
  const candidate = resolve(cwd,input.file_path).toLowerCase();
  return ["data.md", "feature/data.md"].some(file => candidate === resolve(cwd,file).toLowerCase());
}
export function lessonOptions(config: RunConfig, runId: string, reads: string[], controller = new AbortController()): Options {
  const d = directories(config,runId), selected = sourceSelection(config.mode);
  const env = {...process.env}; delete env.CLAUDE_CODE_DISABLE_CLAUDE_MDS;
  return {
    model:MODEL,cwd:d.cwd,
    env:{...env,HOME:d.home,USERPROFILE:d.home,CLAUDE_CONFIG_DIR:d.sdkHome,
      CLAUDE_CODE_DISABLE_AUTO_MEMORY:"1",ENABLE_CLAUDEAI_MCP_SERVERS:"false",
      ...(config.mode === "disabled" ? {CLAUDE_CODE_DISABLE_CLAUDE_MDS:"1"} : {})},
    ...(selected === undefined ? {} : {settingSources:selected}),
    systemPrompt: config.custom
      ? "You are a concise project explainer. Use only the permitted Read tool. Follow applicable project response rules in context. Never invent facts, read instruction files, expose secrets, run commands or claim tests ran."
      : {type:"preset",preset:"claude_code",append:"This is a read-only classroom summary. Follow loaded project response rules; read only the requested data file. Keep the answer brief."},
    tools:["Read"],allowedTools:["Read"],disallowedTools:["Bash","Write","Edit","WebFetch","WebSearch"],
    strictMcpConfig:true,mcpServers:{},plugins:[],skills:[],maxTurns:5,maxBudgetUsd:0.3,
    effort:"low",thinking:{type:"disabled"},persistSession:config.mode === "compact",abortController:controller,
    hooks:{
      PreToolUse:[{hooks:[async input => {
        if (input.hook_event_name === "PreToolUse" && !readAllowed(d.cwd,input.tool_name,input.tool_input as Record<string,unknown>))
          return {hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:"Only owned classroom data files can be read."}};
        return {};
      }]}],
      PostToolUse:[{hooks:[async input => {
        if (input.hook_event_name === "PostToolUse" && input.tool_name === "Read")
          reads.push(relative(d.cwd,resolve(d.cwd,String((input.tool_input as {file_path?:string}).file_path))).replaceAll("\\","/"));
        return {};
      }]}],
    },
    canUseTool:async () => ({behavior:"deny",message:"Only guarded pre-approved data reads are supported."}),
  };
}
export function redact(text:string) {
  const key=process.env.ANTHROPIC_API_KEY;
  return (key ? text.split(key).join("[REDACTED]") : text).replace(/sk-ant-[A-Za-z0-9_-]{16,}/g,"[REDACTED]").slice(0,16000);
}
export async function runAgent(config:RunConfig,emit:(e:LabEvent)=>void,controller=new AbortController()) {
  config=validateConfig(config);const runId=randomUUID();
  emit({type:"fixtures",files:await prepareWorkspace(config,runId)});
  const reads:string[]=[],options=lessonOptions(config,runId,reads,controller);
  emit({type:"options",config,options:{model:MODEL,settingSources:options.settingSources ?? "omitted · user/project/local defaults",
    systemPrompt:options.systemPrompt,disableClaudeMds:config.mode === "disabled",cwd:"owned organization/project",memory:"disabled",tools:options.tools,persistSession:options.persistSession}});
  let sessionId="",text="",compactBoundaries=0;
  const sessionIds:string[]=[],phases:{phase:string;status:string;markers:string[]}[]=[];
  const actions = config.mode === "compact" ? ["summary","compact","recall"] : ["summary"];
  for (const phase of actions) {
    const prompt = phase === "compact" ? "/compact Preserve project facts and applicable project instructions."
      : config.mode === "child" ? PROMPTS.task.replace("Read data.md","Read feature/data.md")
      : PROMPTS.task;
    const run = query({prompt,options:{...options,...(sessionId ? {resume:sessionId} : {})}});
    let gotResult=false;
    try {
      for await (const message of run) {
        emit({type:"message",sdkType:message.type,summary:phase+" · "+("subtype" in message ? String(message.subtype) : "Actual SDK message")});
        if (message.type === "system" && message.subtype === "init") {
          if (sessionId && message.session_id !== sessionId) throw new Error("Owned session identity changed unexpectedly.");
          sessionId=message.session_id;sessionIds.push(sessionId);
          emit({type:"initialized",model:message.model,sessionId});
        }
        if (message.type === "system" && message.subtype === "compact_boundary") {
          compactBoundaries++;
          emit({type:"boundary",trigger:message.compact_metadata.trigger,preTokens:message.compact_metadata.pre_tokens});
        }
        if (message.type === "assistant") for (const block of message.message.content) {
          if (block.type === "text") emit({type:"answer",text:redact(block.text)});
          if (block.type === "tool_use") emit({type:"tool",name:block.name,target:basename(String((block.input as {file_path?:string}).file_path || "data"))});
        }
        if (message.type === "result") {
          gotResult=true;text=redact(message.subtype === "success" ? message.result : message.errors.join("\n"));
          const status=message.subtype === "success" && message.is_error ? "error" : message.subtype;
          phases.push({phase,status,markers:MARKERS.filter(m=>text.includes(m))});
          emit({type:"result",status,text,sessionId:message.session_id,costUsd:message.total_cost_usd,phase});
          if (status !== "success") throw new Error("The real SDK phase did not succeed.");
        }
      }
      if (!gotResult && phase !== "compact") throw new Error("No typed SDK result received.");
      if (phase === "compact" && !compactBoundaries) throw new Error("No actual compaction boundary was observed.");
    } finally {run.close();}
  }
  emit({type:"evidence",reads,returnedMarkers:MARKERS.filter(m=>text.includes(m)),compactBoundaries,sessionIds,phases});
}
