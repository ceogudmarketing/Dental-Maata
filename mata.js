// ── Dental Mata's brain ─────────────────────────────────────
import Anthropic from "@anthropic-ai/sdk";
import { systemPrompt } from "./config.js";
import { upcoming, history, remember, applyActions } from "./store.js";

const KEY = process.env.ANTHROPIC_API_KEY;
console.log(
  KEY
    ? `✅ ANTHROPIC_API_KEY detected — length ${KEY.length}, starts "${KEY.slice(0, 8)}…"`
    : '❌ ANTHROPIC_API_KEY is MISSING. Set it in Render -> Environment, then redeploy.'
);

let client;
function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set in environment");
  return (client ||= new Anthropic({ apiKey: key }));
}

/* ── Guarantees the prompt alone can't provide ───────────────── */

// Keep only 10 digits. Returns null if it isn't a valid Indian mobile.
export function cleanPhone(raw) {
  if (!raw) return null;
  let d = String(raw).replace(/\D/g, "");     // digits only
  if (d.length > 10 && d.startsWith("91")) d = d.slice(2);  // drop +91
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);  // drop leading 0
  return /^[6-9]\d{9}$/.test(d) ? d : null;   // exactly 10, valid start
}

// Last line of defence: never let backend/JSON/code reach a patient.
const LEAK = /(\{\s*"reply"|"actions"\s*:|book_appointment|alert_assistant|message_doctor|system prompt|```)/i;
function safeReply(text) {
  if (!text || LEAK.test(text)) {
    return "I'm here to help you with appointments and any questions about our treatments at ConfiDental Care. How can I help you today? 🦷";
  }
  return text;
}

export async function reply({ channel, user, text, fromPhone }) {
  remember(channel, user, "user", text);
  const ctx = { today: new Date().toISOString().slice(0, 10), upcoming: upcoming(), fromPhone };

  const res = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system: systemPrompt(ctx),
    messages: history(channel, user).slice(-16).map(x => ({ role: x.role, content: x.content }))
  });

  let raw = res.content.map(b => b.text || "").join("").trim();
  raw = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

  let out;
  try { out = JSON.parse(raw); } catch { out = { reply: raw || "…", actions: [] }; }

  // Enforce the 10-digit rule in CODE — don't trust the model to remember.
  const actions = [];
  for (const a of out.actions || []) {
    if (a.type === "book_appointment") {
      const p = cleanPhone(a.phone) || cleanPhone(fromPhone);
      if (!p) {
        console.log("[guard] booking blocked — invalid phone:", JSON.stringify(a.phone));
        out.reply = "Almost there! Could you share your 10-digit mobile number so I can confirm the appointment? 📱";
        continue;                       // drop the booking, ask again
      }
      a.phone = p;                      // store clean 10 digits
    }
    actions.push(a);
  }

  const clean = safeReply(out.reply);
  remember(channel, user, "assistant", clean);
  const log = await applyActions(actions, channel);
  if (log.length) console.log(`[${channel}] ${log.join(" · ")}`);
  return clean;
}
