// الحماية 3/3 (جزء النماذج): تنظيف المدخلات + فخ البوتات (honeypot) + مهلة بين الإرسالات + تحقق الهاتف
import { db } from "../../firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { $, el, clean } from "./common.js";

const COOLDOWN_MS = 60_000;
const STORE_KEY = "lastSent";

const FORMS = {
  consultation: { title: "طلب استشارة قانونية أو تنموية", fields: [["name", "الاسم"], ["phone", "رقم الهاتف"], ["message", "اشرح طلبك", "area"]] },
  complaint: { title: "شكوى أو مقترح", fields: [["name", "الاسم"], ["phone", "رقم الهاتف"], ["kind", "النوع", ["شكوى", "مقترح"]], ["message", "التفاصيل", "area"]] },
  membership: { title: "طلب عضوية أو تطوع", fields: [["name", "الاسم بالكامل"], ["phone", "رقم الهاتف"], ["kind", "النوع", ["عضوية", "تطوع"]], ["district", "الحي"]] },
  contact: { title: "أرسل لنا رسالة", fields: [["name", "الاسم"], ["phone", "رقم الهاتف"], ["message", "رسالتك", "area"]] }
};

function buildField([name, label, kind = "text"]) {
  let input;
  if (Array.isArray(kind)) {
    input = el("select", "field");
    kind.forEach((option) => input.append(new Option(option, option)));
  } else {
    input = el(kind === "area" ? "textarea" : "input", "field");
    if (kind === "area") { input.rows = 4; input.maxLength = 2000; } else { input.type = name === "phone" ? "tel" : "text"; input.maxLength = 200; }
    input.placeholder = label;
  }
  input.name = name;
  input.required = name !== "district";
  input.setAttribute("aria-label", label);
  return input;
}

const say = (note, text, ok) => { note.textContent = text; note.className = `note text-sm ${ok ? "text-green-600" : "text-red-600"}`; };
const lastSent = () => { try { return Number(localStorage.getItem(STORE_KEY) || 0); } catch { return 0; } };
const markSent = () => { try { localStorage.setItem(STORE_KEY, String(Date.now())); } catch { /* ignore */ } };

async function onSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const note = $(".note", form);
  const button = $("button", form);
  if (form.elements.website.value) return; // بوت

  const wait = COOLDOWN_MS - (Date.now() - lastSent());
  if (wait > 0) return say(note, `انتظر ${Math.ceil(wait / 1000)} ثانية قبل الإرسال مرة أخرى.`, false);

  const data = { type: form.dataset.type };
  for (const [key, value] of new FormData(form)) if (key !== "website") data[key] = clean(value, key === "message" ? 2000 : 200);
  if (data.name.length < 2) return say(note, "الاسم قصير جدًا.", false);
  if (!/^[0-9+\-\s]{7,20}$/.test(data.phone)) return say(note, "رقم الهاتف غير صحيح.", false);

  button.disabled = true;
  try {
    await addDoc(collection(db, "messages"), { ...data, status: "new", createdAt: serverTimestamp() });
    markSent(); form.reset();
    say(note, "تم الإرسال بنجاح، سنتواصل معك قريبًا.", true);
  } catch {
    say(note, "تعذر الإرسال، حاول لاحقًا أو تواصل عبر واتساب.", false);
  } finally {
    button.disabled = false;
  }
}

export function renderForms() {
  document.querySelectorAll("[data-form]").forEach((box) => {
    const def = FORMS[box.dataset.form];
    if (!def) return;
    const form = el("form", "bg-white p-5 rounded shadow-sm space-y-3 relative");
    form.dataset.type = box.dataset.form;
    const trap = el("input", "hp"); trap.name = "website"; trap.tabIndex = -1; trap.autocomplete = "off"; trap.setAttribute("aria-hidden", "true");
    const button = el("button", "btn w-full", "إرسال"); button.type = "submit";
    form.append(el("h3", "font-bold text-royal", def.title), ...def.fields.map(buildField), trap, button, el("p", "note text-sm"));
    form.addEventListener("submit", onSubmit);
    box.replaceChildren(form);
  });
}
