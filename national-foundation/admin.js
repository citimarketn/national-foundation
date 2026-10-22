// لوحة التحكم. الحماية 3/3 (جزء الإدارة): قفل بعد محاولات فاشلة + خروج تلقائي عند الخمول + التحقق من قائمة المسؤولين
import { db, auth, storage } from "../../firebase-config.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { collection, addDoc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";
import { $, el, clean, safeUrl, formatDate } from "./common.js";

const MAX_FAILS = 5, LOCK_MS = 5 * 60_000, IDLE_MS = 15 * 60_000, MAX_FILE = 50 * 1024 * 1024;

const SECTIONS = {
  site: { label: "إعدادات الموقع", single: ["settings", "site"], fields: [
    ["slides", "رسائل الواجهة (سطر لكل رسالة: العنوان | النص)", "area"], ["chairmanWord", "كلمة رئيس مجلس الأمناء", "area"],
    ["vision", "الرؤية", "area"], ["mission", "الرسالة", "area"], ["goals", "الأهداف", "area"], ["districts", "الأحياء (سطر لكل حي)", "area"],
    ["whatsapp", "واتساب (بالصيغة الدولية بدون +)"], ["telegram", "اسم مستخدم تلجرام"], ["phone", "الهاتف"], ["email", "البريد"],
    ["address", "العنوان"], ["youtube", "رابط يوتيوب"], ["facebook", "رابط فيسبوك"], ["instagram", "رابط إنستجرام"]] },
  stats: { label: "الإحصائيات", single: ["settings", "stats"], fields: [["initiatives", "عدد المبادرات", "num"], ["services", "الخدمات المقدمة", "num"], ["beneficiaries", "المستفيدون", "num"]] },
  news: { label: "الأخبار", fields: [["title", "العنوان"], ["body", "النص", "area"], ["image", "صورة الخبر", "file"]] },
  press: { label: "البيانات الصحفية", fields: [["title", "العنوان"], ["body", "نص البيان", "area"]] },
  gallery: { label: "الصور والفيديو", fields: [["caption", "وصف"], ["media", "صورة أو فيديو", "file"]] },
  messages: { label: "الطلبات الواردة", readonly: true }
};
const TYPES = { consultation: "استشارة", complaint: "شكوى/مقترح", membership: "عضوية/تطوع", contact: "رسالة" };
const state = { current: "site", editing: null };

const say = (text, ok = true) => { const s = $("#status"); s.textContent = text; s.className = `text-sm mb-3 ${ok ? "text-green-700" : "text-red-600"}`; };
const store = { get: (k) => { try { return Number(localStorage.getItem(k) || 0); } catch { return 0; } }, set: (k, v) => { try { localStorage.setItem(k, String(v)); } catch { /* ignore */ } } };

/* ---------- الدخول والخروج ---------- */
$("#login-btn").addEventListener("click", async () => {
  const left = store.get("lockUntil") - Date.now();
  if (left > 0) return ($("#login-error").textContent = `الدخول مقفل مؤقتًا. حاول بعد ${Math.ceil(left / 60000)} دقيقة.`);
  try {
    await signInWithEmailAndPassword(auth, $("#email").value.trim(), $("#password").value);
    store.set("fails", 0);
  } catch {
    const fails = store.get("fails") + 1;
    store.set("fails", fails);
    if (fails >= MAX_FAILS) { store.set("lockUntil", Date.now() + LOCK_MS); store.set("fails", 0); }
    $("#login-error").textContent = "بيانات الدخول غير صحيحة.";
  }
});
$("#logout").addEventListener("click", () => signOut(auth));

let idleTimer;
const resetIdle = () => { clearTimeout(idleTimer); idleTimer = setTimeout(() => signOut(auth), IDLE_MS); };
["click", "keydown", "touchstart"].forEach((e) => document.addEventListener(e, resetIdle));

onAuthStateChanged(auth, async (user) => {
  let isAdmin = false;
  if (user) {
    try { isAdmin = (await getDoc(doc(db, "admins", user.uid))).exists(); } catch { /* غير مسؤول */ }
    if (!isAdmin) { $("#login-error").textContent = "هذا الحساب ليس مسؤولًا."; await signOut(auth); return; }
  }
  $("#login").classList.toggle("hidden", isAdmin);
  $("#panel").classList.toggle("hidden", !isAdmin);
  if (isAdmin) { resetIdle(); buildTabs(); show("site"); }
});

/* ---------- التبويبات والنموذج ---------- */
function buildTabs() {
  $("#tabs").replaceChildren(...Object.entries(SECTIONS).map(([key, s]) => {
    const b = el("button", "px-4 py-2 rounded bg-white border", s.label);
    b.addEventListener("click", () => show(key));
    return b;
  }));
}

function renderForm(values = {}) {
  const section = SECTIONS[state.current];
  const form = $("#form");
  form.replaceChildren();
  if (section.readonly) return;
  for (const [name, label, kind] of section.fields) {
    const wrap = el("label", "block text-sm", label);
    const input = el(kind === "area" ? "textarea" : "input", "field");
    input.name = name;
    if (kind === "area") input.rows = 5;
    if (kind === "num") input.type = "number";
    if (kind === "file") { input.type = "file"; input.accept = "image/*,video/*"; } else input.value = values[name] ?? "";
    wrap.append(input);
    form.append(wrap);
  }
  const save = el("button", "btn btn-gold", section.single ? "حفظ" : state.editing ? "حفظ التعديل" : "نشر");
  save.type = "submit";
  form.append(save);
}

async function show(key) {
  state.current = key; state.editing = null; say("");
  const section = SECTIONS[key];
  let values = {};
  if (section.single) { const d = await getDoc(doc(db, ...section.single)); values = d.exists() ? d.data() : {}; }
  renderForm(values);
  $("#list").replaceChildren();
  if (!section.single) await renderList(key);
}

/* ---------- القائمة (تعديل / حذف / معالجة) ---------- */
const removeFile = async (url) => { if (safeUrl(url)) { try { await deleteObject(ref(storage, url)); } catch { /* الملف غير موجود */ } } };

async function renderList(key) {
  const snap = await getDocs(query(collection(db, key), orderBy("createdAt", "desc")));
  const list = $("#list");
  if (!snap.size) return list.append(el("li", "py-3 text-gray-500", "لا توجد عناصر بعد."));
  snap.forEach((d) => {
    const x = d.data();
    const li = el("li", "py-3 flex justify-between gap-3 items-start");
    const info = el("div", "text-sm space-y-1");
    const head = key === "messages" ? `${TYPES[x.type] || x.type} — ${x.name} (${x.phone})` : (x.title || x.caption || "—");
    info.append(el("b", "", head), el("p", "text-gray-600 whitespace-pre-line", [x.kind, x.district, x.body, x.message].filter(Boolean).join(" — ")),
      el("p", "text-xs text-gray-400", formatDate(x.createdAt)));
    const actions = el("div", "flex gap-3 text-sm shrink-0");
    if (key === "messages") {
      const done = x.status === "done";
      const toggle = el("button", done ? "text-gray-500" : "text-green-700", done ? "إعادة فتح" : "تمت المعالجة");
      toggle.addEventListener("click", async () => { await updateDoc(doc(db, key, d.id), { status: done ? "new" : "done" }); show(key); });
      actions.append(toggle);
    } else {
      const edit = el("button", "text-blue-700", "تعديل");
      edit.addEventListener("click", () => { state.editing = { id: d.id, data: x }; renderForm(x); scrollTo({ top: 0 }); });
      actions.append(edit);
    }
    const del = el("button", "text-red-600", "حذف");
    del.addEventListener("click", async () => {
      if (!confirm("تأكيد الحذف؟")) return;
      await removeFile(x.imageUrl || x.url);
      await deleteDoc(doc(db, key, d.id));
      show(key);
    });
    actions.append(del);
    li.append(info, actions);
    list.append(li);
  });
}

/* ---------- الحفظ ---------- */
async function upload(file, folder) {
  if (!/^(image|video)\//.test(file.type)) throw new Error("نوع الملف غير مسموح (صور وفيديو فقط).");
  if (file.size > MAX_FILE) throw new Error("حجم الملف أكبر من 50 ميجابايت.");
  const r = ref(storage, `${folder}/${crypto.randomUUID()}_${file.name.replace(/[^\w.-]/g, "_")}`);
  await uploadBytes(r, file);
  return getDownloadURL(r);
}

$("#form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const key = state.current, section = SECTIONS[key], form = event.currentTarget, data = {};
  const button = form.querySelector("button");
  button.disabled = true;
  try {
    for (const [name, , kind] of section.fields) {
      const input = form.elements[name];
      if (kind === "file") {
        const file = input.files[0];
        if (!file) continue;
        say("جارٍ رفع الملف...");
        const url = await upload(file, key);
        await removeFile(state.editing?.data.imageUrl || state.editing?.data.url);
        if (key === "news") data.imageUrl = url; else { data.url = url; data.mediaType = file.type.startsWith("video") ? "video" : "image"; }
      } else {
        data[name] = kind === "num" ? Number(input.value || 0) : clean(input.value, kind === "area" ? 5000 : 300);
      }
    }
    if (section.single) await setDoc(doc(db, ...section.single), data, { merge: true });
    else if (state.editing) await updateDoc(doc(db, key, state.editing.id), { ...data, updatedAt: serverTimestamp() });
    else {
      if (key === "gallery" && !data.url) throw new Error("اختر ملفًا أولًا.");
      await addDoc(collection(db, key), { ...data, createdAt: serverTimestamp() });
    }
    if (!section.single) await show(key);
    say("تم الحفظ بنجاح");
  } catch (err) {
    say(err.message || "حدث خطأ", false);
  } finally {
    button.disabled = false;
  }
});
