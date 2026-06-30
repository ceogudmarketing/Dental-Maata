# Dental Mata — AI front desk for ConfiDental Care

One Claude-powered assistant that answers patients on **WhatsApp**, your **website**, and **Google Business**, books appointments, alerts your dental assistant, messages Dr. Thejasri, and keeps the Excel ledger (`ConfiDental-Practice-Manager.xlsx`) up to date.

```
patient → WhatsApp ─┐
patient → Website  ─┼─→  Dental Mata (Claude)  ─→  data.json  ─→  Excel workbook
patient → Google   ─┘                              (Dashboard formulas update)
```

---

## 1. Run it locally (5 minutes)

You need **Node.js 18+**. Then:

```bash
cd dental-mata-server
npm install
cp .env.example .env          # then open .env and add your keys
cp ../ConfiDental-Practice-Manager.xlsx .   # so Mata can update it
npm start
```

Open **http://localhost:3000/widget.html** and chat as a patient. Bookings appear in `data.json` and are written into the Excel file. Only `ANTHROPIC_API_KEY` is required for this step — WhatsApp/Google keys are only needed for those channels.

Get the Claude key at **console.anthropic.com → API Keys**.

---

## 2. Put the chat on confidental.co.in

The widget is already self-contained. Two options:

- **Quick:** add an `<iframe src="https://YOUR_SERVER/widget.html">` floating in the corner of your site.
- **Cleaner:** copy the `<script>` block from `public/widget.html` into your site's HTML and set `API_URL` to `https://YOUR_SERVER/chat`.

(Your site is built/maintained by GUD Marketing — they can drop either snippet in.)

---

## 3. Connect WhatsApp (+91 9849878238)

Uses Meta's **WhatsApp Cloud API** (free tier available).

1. Go to **developers.facebook.com** → create an app → add the **WhatsApp** product.
2. Register/verify the clinic number **9849878238** in WhatsApp Manager.
3. Copy the **Phone Number ID** and a **permanent access token** into `.env`
   (`WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TOKEN`).
4. In **Configuration → Webhook**, set:
   - Callback URL: `https://YOUR_SERVER/webhook/whatsapp`
   - Verify token: the same string you put in `WHATSAPP_VERIFY_TOKEN`
   - Subscribe to the **messages** field.

Patients messaging your number now get Dental Mata. Prefer no Meta paperwork? A partner like **Interakt, Gupshup or Twilio** gives you the same thing faster — point their webhook at `/webhook/whatsapp` and adapt `sendWhatsApp()`.

---

## 4. Connect Google Business chat

Uses **Google Business Messages**.

1. Apply for access in the **Business Communications** console and register ConfiDental Care (your listing: the Google share link you provided).
2. Create a **service account**, download its JSON, and put it in `.env`
   (`GOOGLE_CREDENTIALS_JSON` or `GOOGLE_CREDENTIALS_PATH`).
3. Set the webhook to `https://YOUR_SERVER/webhook/google`.
4. Uncomment the `sendGoogle()` body in `server.js` and add a small token helper
   (Google's `google-auth-library` makes this one function).

> Note: Google sunset the chat button on *Maps* for some regions. Business Messages still works via your other entry points; if it isn't available for your listing, the WhatsApp + website doors already cover most patients.

---

## 5. Host it so it's always on

The server must run 24/7 for patients to get replies. Easiest options:

- **Render.com** or **Railway.app** — connect this folder as a repo, add the `.env` values in their dashboard, deploy. You get an `https://...` URL to use as `YOUR_SERVER`.
- **A small VPS** (₹400–800/mo) with `pm2 start server.js`.

---

## What's safe to know

- `ANTHROPIC_API_KEY`, WhatsApp tokens, and the Google JSON are **secrets** — keep them only in `.env`, never in your website code or Git.
- I can write all of this, but I can't sign into your Meta or Google accounts for you — those approvals have to come from you. Steps 3–4 are the parts only you can click through.
- The Excel file is the source of truth your front desk can open any time; Dental Mata just keeps it current.

Questions or want me to adapt a specific provider (Interakt/Gupshup/Twilio)? Say which and I'll wire it in.
