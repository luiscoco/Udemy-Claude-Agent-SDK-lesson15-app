export type Mode = "project" | "none" | "combined" | "defaults" | "disabled" | "child" | "compact";
export type RunConfig = { mode: Mode; custom: boolean };
export type LabEvent =
  | { type: "options"; config: RunConfig; options: Record<string, unknown> }
  | { type: "fixtures"; files: {name:string;contents:string}[] }
  | { type: "initialized"; model: string; sessionId: string }
  | { type: "message"; sdkType: string; summary: string }
  | { type: "boundary"; trigger: string; preTokens: number }
  | { type: "tool"; name: string; target: string }
  | { type: "answer"; text: string }
  | { type: "result"; status: string; text: string; sessionId: string; costUsd: number; phase: string }
  | { type: "evidence"; reads: string[]; returnedMarkers: string[]; compactBoundaries: number; sessionIds: string[]; phases: {phase:string;status:string;markers:string[]}[] }
  | { type: "notice" | "error"; text: string };
