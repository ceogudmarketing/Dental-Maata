// ── Dental Mata's brain ─────────────────────────────────────
import Anthropic from "@anthropic-ai/sdk";
import { systemPrompt } from "./config.js";
import { upcoming, history, remember, applyActions } from "./store.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// channel: "whatsapp" | "website" | "google"; user: a stable id (phone / session)
export async function reply({ channel, user, text, fromPhone }) {
  remember(channel, user, "user", text);
  const ctx = { today: new Date().toISOString().slice(0, 10), upcoming: upcoming(), fromPhone };

  const res = await anthropic.messages.create({
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
