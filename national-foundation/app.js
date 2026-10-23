// ملف التطبيق الوحيد: إعداد Firebase + الموقع العام + لوحة التحكم
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-check.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, doc, query, orderBy, limit, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

/* ============ 1) إعدادات Firebase (الحماية 1/3: App Check) ============ */
const firebaseConfig = {
  apiKey: "AIzaSyB3kxmLlMDReCR6hVqbeKJ5IVb_pzLQUnc",
  authDomain: "national-foundation-6945d.firebaseapp.com",
  projectId: "national-foundation-6945d",
  storageBucket: "national-foundation-6945d.firebasestorage.app",
  messagingSenderId: "874449306313",
  appId: "1:874449306313:web:535a88c8ead683caad4318"
};
const RECAPTCHA_SITE_KEY = ""; // من Firebase Console > App Check

const app = initializeApp(firebaseConfig);
if (RECAPTCHA_SITE_KEY) initializeAppCheck(app, { provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY), isTokenAutoRefreshEnabled: true });
const db = getFirestore(app), auth = getAuth(app), storage = getStorage(app);

/* ============ 2) أدوات مشتركة (الحماية 3/3: تنظيف المدخلات) ============ */
const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls = "", text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
const clean = (v, max = 300) => String(v ?? "").replace(/[<>]/g, "").trim().slice(0, max);
const safeUrl = (u) => (/^https:\/\//i.test(u || "") ? u : "");
const fmtDate = (t) => (t?.toDate ? t.toDate().toLocaleDateString("ar-EG") : "");
const store = { get: (k) => { try { return Number(localStorage.getItem(k) || 0); } catch { return 0; } }, set: (k, v) => { try { localStorage.setItem(k, String(v)); } catch { /* ignore */ } } };

const DEFAULTS = {
  slides: "نبني وطنًا يحمي حقوق أبنائه | مؤسسة مشهرة برقم 810 لسنة 2024 تعمل في السويس لخدمة المواطنين ودعم التنمية وحقوق الإنسان.\nاستشارة قانونية وتنموية لكل مواطن | قدّم استشارتك أو شكواك ويتابعها فريق المؤسسة.\nانضم إلينا متطوعًا أو عضوًا | مبادرات ميدانية في أحياء السويس تحتاج إلى سواعد أبنائها.",
  chairmanWord: "", vision: "", mission: "", goals: "", districts: "حي الأربعين\nحي السويس\nحي فيصل\nحي عتاقة",
  whatsapp: "", telegram: "", phone: "", email: "", address: "السويس، جمهورية مصر العربية", youtube: "", facebook: "", instagram: ""
};
const loadSite = async () => { try { const s = await getDoc(doc(db, "settings", "site")); return { ...DEFAULTS, ...(s.exists() ? s.data() : {}) }; } catch { return DEFAULTS; } };
const loadList = async (name, max) => { try { return (await getDocs(query(collection(db, name), orderBy("createdAt", "desc"), limit(max)))).docs.map((d) => d.data()); } catch { return []; } };

/* ============ 3) الموقع العام ============ */
function renderNews(box, items) {
  box.replaceChildren();
  if (!items.length) return box.append(el("p", "text-gray-500", "لا توجد أخبار منشورة بعد."));
  for (const n of items) {
    const card = el("article", "border rounded overflow-hidden bg-white");
    if (safeUrl(n.imageUrl)) { const i = el("img", "h-44 w-full object-cover"); i.src = n.imageUrl; i.alt = n.title || ""; i.loading = "lazy"; card.append(i); }
    const b = el("div", "p-4");
    b.append(el("div", "text-xs text-gray-500", fmtDate(n.createdAt)), el("h3", "font-bold text-royal mt-1", n.title), el("p", "text-sm mt-2 text-gray-700 whitespace-pre-line", n.body));
    card.append(b); box.append(card);
  }
}
function renderPress(box, items) {
  box.replaceChildren();
  if (!items.length) return box.append(el("li", "p-4 text-gray-500", "لا توجد بيانات صحفية بعد."));
  for (const p of items) {
    const li = el("li", "p-4");
    li.append(el("div", "text-xs text-gray-500", `${fmtDate(p.createdAt)} — صادر عن المكتب الإعلامي`), el("b", "text-royal", p.title), el("p", "text-sm mt-1 text-gray-700 whitespace-pre-line", p.body));
    box.append(li);
  }
}
function renderGallery(box, items) {
  box.replaceChildren();
  const list = items.filter((g) => safeUrl(g.url));
  if (!list.length) return box.append(el("p", "text-gray-500 col-span-full", "لا توجد وسائط بعد."));
  for (const g of list) {
    const v = g.mediaType === "video";
    const n = el(v ? "video" : "img", "w-full h-36 object-cover rounded");
    n.src = g.url;
    if (v) n.controls = true; else { n.alt = g.caption || "صورة من فعالية"; n.loading = "lazy"; }
    box.append(n);
  }
}

const FORMS = {
  consultation: { title: "طلب استشارة قانونية أو تنموية", fields: [["name", "الاسم"], ["phone", "رقم الهاتف"], ["message", "اشرح طلبك", "area"]] },
  complaint: { title: "شكوى أو مقترح", fields: [["name", "الاسم"], ["phone", "رقم الهاتف"], ["kind", "النوع", ["شكوى", "مقترح"]], ["message", "التفاصيل", "area"]] },
  membership: { title: "طلب عضوية أو تطوع", fields: [["name", "الاسم بالكامل"], ["phone", "رقم الهاتف"], ["kind", "النوع", ["عضوية", "تطوع"]], ["district", "الحي"]] },
  contact: { title: "أرسل لنا رسالة", fields: [["name", "الاسم"], ["phone", "رقم الهاتف"], ["message", "رسالتك", "area"]] }
};
function buildField([name, label, kind = "text"]) {
  let input;
  if (Array.isArray(kind)) { input = el("select", "field"); kind.forEach((o) => input.append(new Option(o, o))); }
  else {
    input = el(kind === "area" ? "textarea" : "input", "field");
    if (kind === "area") { input.rows = 4; input.maxLength = 2000; } else { input.type = name === "phone" ? "tel" : "text"; input.maxLength = 200; }
    input.placeholder = label;
  }
  input.name = name; input.required = name !== "district"; input.setAttribute("aria-label", label);
  return input;
}
async function submitForm(e) { // فخ البوتات + مهلة بين الإرسالات + تحقق الهاتف
  e.preventDefault();
  const form = e.currentTarget, note = $(".note", form), btn = $("button", form);
  const say = (t, ok) => { note.textContent = t; note.className = `note text-sm ${ok ? "text-green-600" : "text-red-600"}`; };
  if (form.elements.website.value) return;
  const wait = 60_000 - (Date.now() - store.get("lastSent"));
  if (wait > 0) return say(`انتظر ${Math.ceil(wait / 1000)} ثانية قبل الإرسال مرة أخرى.`, false);
  const data = { type: form.dataset.type };
  for (const [k, v] of new FormData(form)) if (k !== "website") data[k] = clean(v, k === "message" ? 2000 : 200);
  if (data.name.length < 2) return say("الاسم قصير جدًا.", false);
  if (!/^[0-9+\-\s]{7,20}$/.test(data.phone)) return say("رقم الهاتف غير صحيح.", false);
  btn.disabled = true;
  try { await addDoc(collection(db, "messages"), { ...data, status: "new", createdAt: serverTimestamp() }); store.set("lastSent", Date.now()); form.reset(); say("تم الإرسال بنجاح، سنتواصل معك قريبًا.", true); }
  catch { say("تعذر الإرسال، حاول لاحقًا أو تواصل عبر واتساب.", false); }
  finally { btn.disabled = false; }
}
function renderForms() {
  document.querySelectorAll("[data-form]").forEach((box) => {
    const def = FORMS[box.dataset.form];
    const form = el("form", "bg-white p-5 rounded shadow-sm space-y-3 relative");
    form.dataset.type = box.dataset.form;
    const trap = el("input", "hp"); trap.name = "website"; trap.tabIndex = -1; trap.autocomplete = "off"; trap.setAttribute("aria-hidden", "true");
    const btn = el("button", "btn w-full", "إرسال"); btn.type = "submit";
    form.append(el("h3", "font-bold text-royal", def.title), ...def.fields.map(buildField), trap, btn, el("p", "note text-sm"));
    form.addEventListener("submit", submitForm);
    box.replaceChildren(form);
  });
}

function route() { // صفحة واحدة بأقسام: #home #about #services #media #contact
  const views = [...document.querySelectorAll("[data-view]")];
  const hash = location.hash.slice(1);
  const id = views.some((v) => v.dataset.view === hash) ? hash : "home";
  views.forEach((v) => v.classList.toggle("hidden", v.dataset.view !== id));
  document.querySelectorAll(".tab").forEach((a) => { const on = a.hash === `#${id}`; a.classList.toggle("active", on); a.setAttribute("aria-selected", on); });
  $("#menu-m").classList.add("hidden");
  scrollTo(0, 0);
}

async function initSite() {
  addEventListener("hashchange", route); route();
  $("#menu-btn").addEventListener("click", () => $("#menu-m").classList.toggle("hidden"));
  renderForms();
  const [site, news, press, gallery, stats] = await Promise.all([
    loadSite(), loadList("news", 12), loadList("press", 20), loadList("gallery", 24),
    getDoc(doc(db, "settings", "stats")).then((s) => (s.exists() ? s.data() : {})).catch(() => ({}))
  ]);

  const slides = site.slides.split("\n").filter(Boolean).map((line) => {
    const [title, text = ""] = line.split("|").map((s) => s.trim());
    const s = el("div", "slide"); s.append(el("h2", "font-head text-3xl md:text-5xl leading-snug", title), el("p", "mt-3 text-white/85 max-w-xl", text)); return s;
  });
  $("#slides").replaceChildren(...slides);
  let i = 0; slides[0]?.classList.add("on");
  if (slides.length > 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches)
    setInterval(() => { slides[i].classList.remove("on"); i = (i + 1) % slides.length; slides[i].classList.add("on"); }, 5000);

  $("#st-initiatives").textContent = stats.initiatives ?? 0; $("#st-services").textContent = stats.services ?? 0; $("#st-beneficiaries").textContent = stats.beneficiaries ?? 0;
  renderNews($("#news-home"), news.slice(0, 3)); renderNews($("#news"), news); renderPress($("#press"), press); renderGallery($("#gallery"), gallery);

  for (const k of ["chairmanWord", "vision", "mission", "goals"]) $(`#${k}`).textContent = site[k] || "سيتم إضافة المحتوى قريبًا.";
  $("#districts").replaceChildren(...site.districts.split("\n").map((s) => s.trim()).filter(Boolean).map((n) => el("div", "border rounded p-3", n)));

  [site.address, site.phone, site.email].filter(Boolean).forEach((t) => $("#info").append(el("p", "text-sm", t)));
  const wa = clean(site.whatsapp, 20).replace(/\D/g, ""), tg = clean(site.telegram, 40).replace(/[^\w]/g, "");
  for (const [label, url] of [["يوتيوب", safeUrl(site.youtube)], ["فيسبوك", safeUrl(site.facebook)], ["إنستجرام", safeUrl(site.instagram)], ["تلجرام", tg && `https://t.me/${tg}`]]) {
    if (!url) continue;
    const a = el("a", "hover:underline", label); a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer"; $("#social").append(a);
  }
  const fab = (href, label, color, pos) => { const a = el("a", `fixed ${pos} left-5 z-50 ${color} text-white rounded-full px-4 py-3 shadow-lg text-sm font-bold`, label); a.href = href; a.target = "_blank"; a.rel = "noopener noreferrer"; document.body.append(a); };
  if (wa) fab(`https://wa.me/${wa}`, "واتساب", "bg-green-600", "bottom-5");
  if (tg) fab(`https://t.me/${tg}`, "تلجرام", "bg-sky-600", "bottom-20");
}

/* ============ 4) لوحة التحكم (الحماية 3/3: قفل + خروج تلقائي + قائمة مسؤولين) ============ */
const SECTIONS = {
  site: { label: "إعدادات الموقع", single: ["settings", "site"], fields: [
    ["slides", "رسائل الواجهة (سطر لكل رسالة: العنوان | النص)", "area"], ["chairmanWord", "كلمة رئيس مجلس الأمناء", "area"], ["vision", "الرؤية", "area"],
    ["mission", "الرسالة", "area"], ["goals", "الأهداف", "area"], ["districts", "الأحياء (سطر لكل حي)", "area"],
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

function initAdmin() {
  const say = (t, ok = true) => { const s = $("#status"); s.textContent = t; s.className = `text-sm mb-3 ${ok ? "text-green-700" : "text-red-600"}`; };
  const removeFile = async (url) => { if (safeUrl(url)) { try { await deleteObject(ref(storage, url)); } catch { /* ignore */ } } };

  $("#login-btn").addEventListener("click", async () => {
    const left = store.get("lockUntil") - Date.now();
    if (left > 0) return ($("#login-error").textContent = `الدخول مقفل مؤقتًا. حاول بعد ${Math.ceil(left / 60000)} دقيقة.`);
    try { await signInWithEmailAndPassword(auth, $("#email").value.trim(), $("#password").value); store.set("fails", 0); }
    catch {
      const f = store.get("fails") + 1; store.set("fails", f);
      if (f >= 5) { store.set("lockUntil", Date.now() + 5 * 60_000); store.set("fails", 0); }
      $("#login-error").textContent = "بيانات الدخول غير صحيحة.";
    }
  });
  $("#logout").addEventListener("click", () => signOut(auth));

  let idle; const resetIdle = () => { clearTimeout(idle); idle = setTimeout(() => signOut(auth), 15 * 60_000); };
  ["click", "keydown", "touchstart"].forEach((e) => document.addEventListener(e, resetIdle));

  onAuthStateChanged(auth, async (user) => {
    let ok = false;
    if (user) {
      try { ok = (await getDoc(doc(db, "admins", user.uid))).exists(); } catch { /* ignore */ }
      if (!ok) { $("#login-error").textContent = "هذا الحساب ليس مسؤولًا."; await signOut(auth); return; }
    }
    $("#login").classList.toggle("hidden", ok); $("#panel").classList.toggle("hidden", !ok);
    if (ok) { resetIdle(); buildTabs(); show("site"); }
  });

  const buildTabs = () => $("#tabs").replaceChildren(...Object.entries(SECTIONS).map(([k, s]) => { const b = el("button", "px-4 py-2 rounded bg-white border", s.label); b.addEventListener("click", () => show(k)); return b; }));

  function renderForm(values = {}) {
    const sec = SECTIONS[state.current], form = $("#form");
    form.replaceChildren();
    if (sec.readonly) return;
    for (const [name, label, kind] of sec.fields) {
      const wrap = el("label", "block text-sm", label), input = el(kind === "area" ? "textarea" : "input", "field");
      input.name = name;
      if (kind === "area") input.rows = 5;
      if (kind === "num") input.type = "number";
      if (kind === "file") { input.type = "file"; input.accept = "image/*,video/*"; } else input.value = values[name] ?? "";
      wrap.append(input); form.append(wrap);
    }
    const save = el("button", "btn btn-gold", sec.single ? "حفظ" : state.editing ? "حفظ التعديل" : "نشر"); save.type = "submit"; form.append(save);
  }

  async function show(key) {
    state.current = key; state.editing = null; say("");
    const sec = SECTIONS[key]; let values = {};
    if (sec.single) { const d = await getDoc(doc(db, ...sec.single)); values = d.exists() ? d.data() : {}; }
    renderForm(values); $("#list").replaceChildren();
    if (!sec.single) await renderList(key);
  }

  async function renderList(key) {
    const snap = await getDocs(query(collection(db, key), orderBy("createdAt", "desc"))), list = $("#list");
    if (!snap.size) return list.append(el("li", "py-3 text-gray-500", "لا توجد عناصر بعد."));
    snap.forEach((d) => {
      const x = d.data(), li = el("li", "py-3 flex justify-between gap-3 items-start"), info = el("div", "text-sm space-y-1"), actions = el("div", "flex gap-3 text-sm shrink-0");
      const head = key === "messages" ? `${TYPES[x.type] || x.type} — ${x.name} (${x.phone})` : (x.title || x.caption || "—");
      info.append(el("b", "", head), el("p", "text-gray-600 whitespace-pre-line", [x.kind, x.district, x.body, x.message].filter(Boolean).join(" — ")), el("p", "text-xs text-gray-400", fmtDate(x.createdAt)));
      if (key === "messages") {
        const done = x.status === "done", t = el("button", done ? "text-gray-500" : "text-green-700", done ? "إعادة فتح" : "تمت المعالجة");
        t.addEventListener("click", async () => { await updateDoc(doc(db, key, d.id), { status: done ? "new" : "done" }); show(key); }); actions.append(t);
      } else {
        const e = el("button", "text-blue-700", "تعديل"); e.addEventListener("click", () => { state.editing = { id: d.id, data: x }; renderForm(x); scrollTo({ top: 0 }); }); actions.append(e);
      }
      const del = el("button", "text-red-600", "حذف");
      del.addEventListener("click", async () => { if (!confirm("تأكيد الحذف؟")) return; await removeFile(x.imageUrl || x.url); await deleteDoc(doc(db, key, d.id)); show(key); });
      actions.append(del); li.append(info, actions); list.append(li);
    });
  }

  async function upload(file, folder) {
    if (!/^(image|video)\//.test(file.type)) throw new Error("نوع الملف غير مسموح (صور وفيديو فقط).");
    if (file.size > 50 * 1024 * 1024) throw new Error("حجم الملف أكبر من 50 ميجابايت.");
    const r = ref(storage, `${folder}/${crypto.randomUUID()}_${file.name.replace(/[^\w.-]/g, "_")}`);
    await uploadBytes(r, file); return getDownloadURL(r);
  }

  $("#form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const key = state.current, sec = SECTIONS[key], form = e.currentTarget, data = {}, btn = form.querySelector("button");
    btn.disabled = true;
    try {
      for (const [name, , kind] of sec.fields) {
        const input = form.elements[name];
        if (kind === "file") {
          const file = input.files[0]; if (!file) continue;
          say("جارٍ رفع الملف...");
          const url = await upload(file, key);
          await removeFile(state.editing?.data.imageUrl || state.editing?.data.url);
          if (key === "news") data.imageUrl = url; else { data.url = url; data.mediaType = file.type.startsWith("video") ? "video" : "image"; }
        } else data[name] = kind === "num" ? Number(input.value || 0) : clean(input.value, kind === "area" ? 5000 : 300);
      }
      if (sec.single) await setDoc(doc(db, ...sec.single), data, { merge: true });
      else if (state.editing) await updateDoc(doc(db, key, state.editing.id), { ...data, updatedAt: serverTimestamp() });
      else { if (key === "gallery" && !data.url) throw new Error("اختر ملفًا أولًا."); await addDoc(collection(db, key), { ...data, createdAt: serverTimestamp() }); }
      if (!sec.single) await show(key);
      say("تم الحفظ بنجاح");
    } catch (err) { say(err.message || "حدث خطأ", false); }
    finally { btn.disabled = false; }
  });
}

document.body.id === "admin" ? initAdmin() : initSite();
