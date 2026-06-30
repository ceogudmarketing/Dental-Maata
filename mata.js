// ── Dental Mata's brain ─────────────────────────────────────
import Anthropic from "@anthropic-ai/sdk";
import { systemPrompt } from "./config.js";
import { upcoming, history, remember, applyActions } from "./store.js";

// Startup diagnostic: prove whether the key reached this process.
const KEY = process.env.ANTHROPIC_API_KEY;
console.log(
  KEY
    ? `✅ ANTHROPIC_API_KEY detected — length ${KEY.length}, starts "${KEY.slice(0, 8)}…"`
    : '❌ ANTHROPIC_API_KEY is MISSING. Set it in Render -> Environment (exact name ANTHROPIC_API_KEY), then redeploy.'
);

let client;
function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set in environment");
  return (client ||= new Anthropic({ apiKey: key }));
}

export async function reply({ channel, user, text, fromPhone }) {
  remember(channel, user, "user", text);
  const ctx = { today: new Date().toISOString().slice(0, 10), upcoming: upcoming(), fromPhone };

  const res = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system: systemPrompt(ctx),
    messages: history(channel, user)
  });

  let raw = res.content.map(b => b.text || "").join("").trim();
  raw = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  let out;
  try { out = JSON.parse(raw); } catch { out = { reply: raw || "…", actions: [] }; }

  remember(channel, user, "assistant", out.reply);
  const log = await applyActions(out.actions, channel);
  if (log.length) console.log(`[${channel}] ${log.join(" · ")}`);
  return out.reply;
}
