// ── Google Calendar integration ─────────────────────────────
// When Dental Mata books an appointment, drop it into the clinic's
// Google Calendar. Uses a Google service account that you've shared
// the clinic calendar with. No-ops quietly if not configured.
import { google } from "googleapis";

const TZ = "Asia/Kolkata";
let cal = null;

function getCal() {
  if (cal) return cal;
  const raw = process.env.GOOGLE_CALENDAR_CREDENTIALS_JSON;
  if (!raw || !process.env.GOOGLE_CALENDAR_ID) return null;
  const creds = JSON.parse(raw);
  const auth = new google.auth.JWT(
    creds.client_email, null, creds.private_key,
    ["https://www.googleapis.com/auth/calendar.events"]
  );
  cal = google.calendar({ version: "v3", auth });
  return cal;
}

function addMinutes(hhmm, mins) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m + mins);
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

export async function addCalendarEvent(appt) {
  const c = getCal();
  if (!c) { console.log("[calendar] not configured — skipping event for", appt.patient); return; }
  const end = addMinutes(appt.time, 30);
  await c.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    requestBody: {
      summary: `${appt.urgent ? "⚠ " : ""}${appt.patient} — ${appt.reason}`,
      description: `Booked via Dental Mata (${appt.channel}).\nPhone: ${appt.phone || "—"}\nFee: ₹${appt.fee}`,
      start: { dateTime: `${appt.date}T${appt.time}:00`, timeZone: TZ },
      end:   { dateTime: `${appt.date}T${end}:00`,       timeZone: TZ }
    }
  });
  console.log("[calendar] event created:", appt.patient, appt.date, appt.time);
}
