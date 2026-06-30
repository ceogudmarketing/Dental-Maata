# Connect WhatsApp via Meta Cloud API — ConfiDental Care

This wires patients messaging **+91 9849878238** straight to Dental Mata. Free to run for user-initiated chats. About 30–45 minutes of clicking, once.

> One thing to decide first: your number **9849878238**. To use it on the Cloud API it must **not** be logged into the regular WhatsApp or WhatsApp Business app. If it's currently on the WhatsApp Business app, you'll delete that account during registration (your chat history there is lost). If you'd rather not touch the live number yet, do steps 1–6 with Meta's free **test number** to see Mata working, then swap in 9849878238 when you're ready.

---

### 1. Create the app
1. Go to **developers.facebook.com** → log in with the Facebook account that manages ConfiDental's business → **My Apps → Create App**.
2. Use case: **Other** → type: **Business** → name it `ConfiDental Mata` → create.
3. On the dashboard, find **WhatsApp** and click **Set up**. Link or create a **Meta Business Portfolio** for ConfiDental Care.

### 2. Get the Phone Number ID
- In the left menu: **WhatsApp → API Setup**.
- You'll see a **test number** and its **Phone number ID**. Copy that ID → `.env` as `WHATSAPP_PHONE_NUMBER_ID`.
- (Later, to use 9849878238: **WhatsApp → API Setup → Add phone number**, verify by OTP/SMS, then use *its* Phone number ID instead.)

### 3. Get a permanent token
The token shown on API Setup expires in 24 hours — fine for testing, not for production. For a permanent one:
1. **business.facebook.com → Settings (gear) → Users → System users → Add** → name `mata-bot`, role **Admin**.
2. **Assign assets** → your WhatsApp account → toggle **Full control**.
3. **Generate new token** → pick the app → permissions **whatsapp_business_messaging** and **whatsapp_business_management** → generate.
4. Copy it → `.env` as `WHATSAPP_TOKEN`. (Save it now — it's shown once.)

### 4. Get the App Secret
- **App dashboard → App settings → Basic → App Secret → Show** → copy → `.env` as `WHATSAPP_APP_SECRET`.
- This lets the server reject fake webhook calls.

### 5. Deploy the server so it has a public URL
Meta needs an `https://` address to send messages to. Deploy this folder to **Render.com** (free tier):
1. Push the folder to a GitHub repo (or use Render's "deploy from folder").
2. New **Web Service** → build `npm install`, start `npm start`.
3. Add all the `.env` values in Render's **Environment** tab.
4. You'll get a URL like `https://confidental-mata.onrender.com`. That's `YOUR_SERVER`.

### 6. Point the webhook at the server
1. **WhatsApp → Configuration → Webhook → Edit**.
2. **Callback URL:** `https://YOUR_SERVER/webhook/whatsapp`
3. **Verify token:** the exact string in your `.env` `WHATSAPP_VERIFY_TOKEN` (default `confidental-mata-verify`).
4. **Verify and save** — it should go green (the server answers the check).
5. Under **Webhook fields**, **Subscribe** to **messages**.

### 7. Test
- From any other phone, message your test number (or 9849878238 once added). Within a second or two you'll get Dental Mata's reply, the booking lands in `data.json`, and the row appears in your Excel workbook.

### 8. Go live
- **App dashboard → top toggle → switch to Live.**
- Complete **Business Verification** in Business Settings (Meta requires it for production volume; a few documents, reviewed in a couple of days).

---

### Good to know
- **Cost:** patients messaging you first are "service" conversations — currently free under Meta's pricing, with paid templates only if *you* start a chat after 24h of silence. Mata only ever replies inside that window, so day-to-day running is free. (Meta changes pricing occasionally — check developers.facebook.com/docs/whatsapp/pricing.)
- **Secrets** (`WHATSAPP_TOKEN`, `WHATSAPP_APP_SECRET`, `ANTHROPIC_API_KEY`) live only in `.env` / Render's Environment tab — never in your website or GitHub.
- The bits I can't do for you are the Meta logins and approvals in steps 1–8 — those need your business account. Everything they plug into is already coded and waiting.

Stuck on any step? Tell me where and I'll get specific.
