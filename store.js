// ── Data store + Excel writer ───────────────────────────────
// Keeps a JSON record of everything and mirrors bookings/charges/
// tasks/notes into the formatted Excel workbook so your dashboard
// (which uses formulas) updates itself.

import fs from "fs";
import ExcelJS from "exceljs";
import { CLINIC } from "./config.js";

const DB_PATH = "./data.json";
const EXCEL_PATH = process.env.EXCEL_PATH || "./ConfiDental-Practice-Manager.xlsx";

const empty = { appts: [], patients: [], tasks: [], doctor: [], accounts: [], chats: {} };
export const db = fs.existsSync(DB_PATH)
  ? JSON.parse(fs.readFileSync(DB_PATH, "utf8"))
  : structuredClone(empty);

function persist() { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }
const id = () => Math.random().toString(36).slice(2, 9);
export function upcoming() {
  const t = new Date().toISOString().slice(0, 10);
  return db.appts.filter(a => a.status === "Booked" && a.date >= t);
}
export function history(channel, user) {
  const key = `${channel}:${user}`;
  return (db.chats[key] ||= []);
}
export function remember(channel, user, role, content) {
  history(channel, user).push({ role, content });
  const h = history(channel, user);
  if (h.length > 16) db.chats[`${channel}:${user}`] = h.slice(-16);
  persist();
}

// Apply the actions Dental Mata returned. Returns a short log array.
export async function applyActions(actions, channel) {
  const log = [];
  for (const a of actions || []) {
    if (a.type === "book_appointment") {
      const appt = { id: id(), date: a.date, time: a.time, patient: a.patient_name,
        phone: a.phone || "", reason: a.reason || "Consultation", channel,
        urgent: !!a.urgent, status: "Booked", fee: a.fee || CLINIC.defaultFee };
      db.appts.push(appt);
      if (!db.patients.some(p => p.name === appt.patient))
        db.patients.push({ name: appt.patient, phone: appt.phone, channel });
      db.tasks.push({ date: appt.date, patient: appt.patient,
        task: `${appt.urgent ? "⚠ " : ""}Prep for ${appt.reason} at ${appt.time}`,
        status: "Open", priority: appt.urgent ? "High" : "Normal" });
      db.accounts.push({ date: appt.date, patient: appt.patient,
        treatment: appt.reason, charge: appt.fee, paid: 0 });
      log.push(`Booked ${appt.patient} ${appt.date} ${appt.time}`);
    } else if (a.type === "reschedule") {
      const ap = [...db.appts].reverse().find(x => x.patient === a.patient_name && x.status === "Booked");
      if (ap) { ap.date = a.date; ap.time = a.time; log.push(`Rescheduled ${a.patient_name}`); }
    } else if (a.type === "cancel") {
      const ap = [...db.appts].reverse().find(x => x.patient === a.patient_name && x.status === "Booked");
      if (ap) { ap.status = "Cancelled"; log.push(`Cancelled ${a.patient_name}`); }
    } else if (a.type === "message_doctor") {
      db.doctor.push({ date: new Date().toISOString().slice(0,10), patient: "",
        message: a.text, priority: a.priority || "Normal", ack: "No" });
      log.push("Doctor notified");
    } else if (a.type === "alert_assistant") {
      db.tasks.push({ date: new Date().toISOString().slice(0,10), patient: "",
        task: a.text, status: "Open", priority: a.priority || "Normal" });
      log.push("Assistant tasked");
    }
  }
  if (log.length) { persist(); await syncExcel().catch(e => console.error("Excel sync:", e.message)); }
  return log;
}

// Rewrite the data sheets of the workbook from db, keeping the
// Dashboard formulas and styling intact.
export async function syncExcel() {
  if (!fs.existsSync(EXCEL_PATH)) return;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL_PATH);
  const reset = (name, header, rows) => {
    const ws = wb.getWorksheet(name); if (!ws) return;
    while (ws.rowCount > 1) ws.spliceRows(2, 1);
    rows.forEach(r => ws.addRow(r));
  };
  reset("Appointments", null, db.appts.map(a =>
    [a.date, a.time, a.patient, a.phone, a.reason, a.channel, a.urgent ? "Yes" : "No", a.status, a.fee]));
  reset("Accounts", null, db.accounts.map(a =>
    [a.date, a.patient, a.treatment, a.charge, a.paid, { formula: `D${0}-E${0}` }]));
  // fix Due formulas with correct row numbers
  const acc = wb.getWorksheet("Accounts");
  if (acc) acc.eachRow((row, i) => { if (i > 1) row.getCell(6).value = { formula: `D${i}-E${i}` }; });
  reset("Assistant Tasks", null, db.tasks.map(t => [t.date, t.patient, t.task, t.status, t.priority]));
  reset("Doctor Messages", null, db.doctor.map(m => [m.date, m.patient, m.message, m.priority, m.ack]));
  // Patients sheet keeps its formulas; just refresh the name/phone/channel
  const pt = wb.getWorksheet("Patients");
  if (pt) {
    while (pt.rowCount > 1) pt.spliceRows(2, 1);
    db.patients.forEach((p, i) => {
      const r = i + 2;
      pt.addRow([p.name, p.phone, p.channel,
        { formula: `COUNTIFS(Appointments!$C$2:$C$1000,$A${r},Appointments!$H$2:$H$1000,"Done")` },
        { formula: `SUMIF(Accounts!$B$2:$B$1000,$A${r},Accounts!$D$2:$D$1000)` },
        { formula: `SUMIF(Accounts!$B$2:$B$1000,$A${r},Accounts!$E$2:$E$1000)` },
        { formula: `E${r}-F${r}` }]);
    });
  }
  await wb.xlsx.writeFile(EXCEL_PATH);
}
