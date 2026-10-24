import test from "node:test";
import assert from "node:assert/strict";
import { sourceSelection,lessonOptions,validateConfig,readAllowed,directories } from "./agent.js";
test("source omission and explicit empty lists stay distinct",()=>{
  assert.equal(sourceSelection("defaults"),undefined);
  assert.deepEqual(sourceSelection("none"),[]);
  assert.deepEqual(sourceSelection("combined"),["user","project"]);
  assert.equal(Object.hasOwn(lessonOptions({mode:"defaults",custom:false},"test",[]),"settingSources"),false);
});
test("disable flag is explicit and cannot leak from the launching shell",()=>{
  const original=process.env.CLAUDE_CODE_DISABLE_CLAUDE_MDS;
  try {
    process.env.CLAUDE_CODE_DISABLE_CLAUDE_MDS="1";
    assert.equal(lessonOptions({mode:"project",custom:false},"test",[]).env?.CLAUDE_CODE_DISABLE_CLAUDE_MDS,undefined);
    assert.equal(lessonOptions({mode:"disabled",custom:false},"test",[]).env?.CLAUDE_CODE_DISABLE_CLAUDE_MDS,"1");
  } finally {if(original===undefined)delete process.env.CLAUDE_CODE_DISABLE_CLAUDE_MDS;else process.env.CLAUDE_CODE_DISABLE_CLAUDE_MDS=original;}
});
test("custom prompt retains independently selected project context",()=>{
  const o=lessonOptions({mode:"combined",custom:true},"test",[]);
  assert.equal(typeof o.systemPrompt,"string");assert.deepEqual(o.settingSources,["user","project"]);
});
test("only compact mode persists and browser cannot submit paths",()=>{
  assert.equal(lessonOptions({mode:"compact",custom:false},"test",[]).persistSession,true);
  assert.equal(lessonOptions({mode:"project",custom:false},"test",[]).persistSession,false);
  for(const v of [null,{mode:"../",custom:false},{mode:"project",custom:"false"}])assert.throws(()=>validateConfig(v));
});
test("guard allows owned data files and rejects instruction reads",()=>{
  const cwd=directories({mode:"child",custom:false},"test").cwd;
  assert.ok(readAllowed(cwd,"Read",{file_path:"feature/data.md"}));
  for(const path of ["CLAUDE.md","../CLAUDE.md","feature/CLAUDE.md",".claude/rules/api.md"])assert.equal(readAllowed(cwd,"Read",{file_path:path}),false);
  assert.equal(readAllowed(cwd,"Bash",{file_path:"data.md"}),false);
});
