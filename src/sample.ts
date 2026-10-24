import { runAgent, validateConfig } from "./agent.js";
await runAgent(validateConfig({ mode: process.argv[2] || "project", custom: process.argv.includes("--custom") }), e => {
  if (e.type === "answer") console.log(e.text);
  else if (e.type !== "message") console.log(JSON.stringify(e));
});
