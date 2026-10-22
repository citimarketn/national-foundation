// أدوات مشتركة: DOM آمن، تنظيف مدخلات، تحميل إعدادات الموقع، الهيدر والفوتر
import { db } from "../../firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

export const $ = (selector, root = document) => root.querySelector(selector);

export const el = (tag, className = "", text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

export const clean = (value, max = 300) => String(value ?? "").replace(/[<>]/g, "").trim().slice(0, max);
export const safeUrl = (url) => (/^https:\/\//i.test(url || "") ? url : "");
export const formatDate = (ts) => (ts?.toDate ? ts.toDate().toLocaleDateString("ar-EG") : "");

export const DEFAULTS = {
  slides: "نبني وطنًا يحمي حقوق أبنائه | مؤسسة مشهرة برقم 810 لسنة 2024 تعمل في السويس لخدمة المواطنين ودعم التنمية وحقوق الإنسان.\nاستشارة قانونية وتنموية لكل مواطن | قدّم استشارتك أو شكواك ويتابعها فريق المؤسسة.\nانضم إلينا متطوعًا أو عضوًا | مبادرات ميدانية في أحياء السويس تحتاج إلى سواعد أبنائها.",
  chairmanWord: "", vision: "", mission: "", goals: "",
  districts: "حي الأربعين\nحي السويس\nحي فيصل\nحي عتاقة",
  whatsapp: "", telegram: "", phone: "", email: "",
  address: "السويس، جمهورية مصر العربية",
  youtube: "", facebook: "", instagram: ""
};

export async function loadSite() {
  try {
    const snap = await getDoc(doc(db, "settings", "site"));
    return { ...DEFAULTS, ...(snap.exists() ? snap.data() : {}) };
  } catch {
    return DEFAULTS;
  }
}

const NAV = [
  ["index.html", "الرئيسية"], ["about.html", "عن المؤسسة"], ["services.html", "الخدمات"],
  ["media.html", "المركز الإعلامي"], ["contact.html", "اتصل بنا"]
];

const floatButton = (href, label, color, bottom) => {
  const a = el("a", `fixed ${bottom} left-5 z-50 ${color} text-white rounded-full px-4 py-3 shadow-lg text-sm font-bold`, label);
  a.href = href; a.target = "_blank"; a.rel = "noopener noreferrer";
  return a;
};

export function renderLayout(site, active) {
  const links = NAV.map(([href, label]) =>
    `<a href="${href}" class="${href === active ? "text-gold2" : "hover:text-gold2"}">${label}</a>`).join("");

  $("#site-header").innerHTML = `
    <div class="flag-bar"></div>
    <header class="bg-royal text-white shadow sticky top-0 z-40">
      <div class="max-w-6xl mx-auto flex items-center justify-between px-4 py-2">
        <a href="index.html" class="flex items-center gap-3">
          <img src="assets/logo.jpg" alt="شعار المؤسسة" class="h-12 w-12 rounded-full border-2 border-gold">
          <span class="font-head text-lg leading-tight hidden sm:block">المؤسسة المصرية الوطنية<br>والتنمية وحقوق الإنسان بالسويس</span>
        </a>
        <button id="menu-btn" class="md:hidden p-2" aria-label="القائمة">☰</button>
        <nav class="hidden md:flex gap-5 text-sm font-medium">${links}</nav>
      </div>
      <nav id="menu-m" class="hidden md:hidden bg-royal2 px-4 pb-3 flex flex-col gap-2 text-sm">${links}</nav>
    </header>`;
  $("#menu-btn").addEventListener("click", () => $("#menu-m").classList.toggle("hidden"));

  $("#site-footer").innerHTML = `
    <footer class="bg-ink text-white/70 text-center text-xs pb-5">
      <div class="flag-bar mb-4"></div>
      © 2026 المؤسسة المصرية الوطنية والتنمية وحقوق الإنسان بالسويس — مشهرة برقم 810/2024
    </footer>`;

  const wa = clean(site.whatsapp, 20).replace(/\D/g, "");
  const tg = clean(site.telegram, 40).replace(/[^\w]/g, "");
  if (wa) document.body.append(floatButton(`https://wa.me/${wa}`, "واتساب", "bg-green-600", "bottom-5"));
  if (tg) document.body.append(floatButton(`https://t.me/${tg}`, "تلجرام", "bg-sky-600", "bottom-20"));
}

export const pageHead = (title) => {
  const h = el("div", "bg-royal text-white py-10");
  const inner = el("div", "max-w-6xl mx-auto px-4");
  inner.append(el("h1", "font-head text-4xl", title), el("div", "gold-line"));
  h.append(inner);
  return h;
};
