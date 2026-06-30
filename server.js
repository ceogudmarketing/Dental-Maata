// ── Dental Mata server ──────────────────────────────────────
// One assistant, three front doors: WhatsApp · Website · Google.
import "dotenv/config";
import crypto from "crypto";
import express from "express";
import { reply } from "./mata.js";

const app = express();
app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));
app.use(express.static("public"));

const V = process.env.WHATSAPP_API_VERSION || "v21.0";

/* ===========================================================
   HEALTH CHECK — open this in a browser to see if the key loaded
   =========================================================== */
app.get("/health", (_req, res) => {
  const k = process.env.ANTHROPIC_API_KEY;
  res.type("text/plain").send(
    k
      ? `✅ OK — Anthropic key IS loaded on this server (length ${k.length}, starts "${k.slice(0, 8)}").`
      : `❌ PROBLEM — ANTHROPIC_API_KEY is MISSING from this server's environment. Add it in Render → Environment, then redeploy.`
  );
});

/* ===========================================================
   1) WEBSITE CHAT  (used by public/widget.html)
   =========================================================== */
app.post("/chat", async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    const answer = await reply({ channel: "website", user: sessionId || "web", text: message });
    res.json({ reply: answer });
  } catch (e) { console.error(e); res.status(500).json({ reply: "Sorry, please try again in a moment." }); }
});

/* ===========================================================
   2) WHATSAPP  (Meta WhatsApp Cloud API)
   =========================================================== */
app.get("/webhook/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"], token = req.query["hub.verify_token"], challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) return res.send(challenge);
  res.sendStatus(403);
});

function validSignature(req) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return true;
  const sig = req.get("x-hub-signature-256") || "";
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(req.rawBody).digest("hex");
  try { return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)); } catch { return false; }
}

const seen = new Set();
app.post("/webhook/whatsapp", async (req, res) => {
  if (!validSignature(req)) return res.sendStatus(401);
  res.sendStatus(200);
  try {
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    const msg = value?.messages?.[0];
    if (!msg || msg.type !== "text") return;
    if (seen.has(msg.id)) return; seen.add(msg.id);
    if (seen.size > 5000) seen.clear();
    const from = msg.from;
    markRead(msg.id).catch(() => {});
    const answer = await reply({ channel: "whatsapp", user: from, text: msg.text.body, fromPhone: "+" + from });
    await sendWhatsApp(from, answer);
  } catch (e) { console.error("WA:", e.message); }
});

async function sendWhatsApp(to, body) {
  const r = await fetch(`https://graph.facebook.com/${V}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, text: { body } })
  });
  if (!r.ok) console.error("WA send:", await r.text());
}
async function markRead(messageId) {
  await fetch(`https://graph.facebook.com/${V}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", status: "read", message_id: messageId })
  });
}

/* ===========================================================
   3) GOOGLE BUSINESS MESSAGES
   =========================================================== */
app.post("/webhook/google", async (req, res) => {
  res.sendStatus(200);
  try {
    const m = req.body?.message;
    if (!m?.text) return;
    const convId = req.body.conversationId;
    const answer = await reply({ channel: "google", user: convId, text: m.text });
    await sendGoogle(convId, answer);
  } catch (e) { console.error("Google:", e.message); }
});
async function sendGoogle(conversationId, text) {
  console.log("[google → reply ready]", text.slice(0, 60));
}

app.get("/", (_, res) => res.send("Dental Mata is running. Health check at /health · widget at /widget.html"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🦷 Dental Mata listening on :${PORT}`));
