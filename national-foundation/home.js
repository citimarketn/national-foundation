import { db } from "../../firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { $, el, loadSite, renderLayout } from "./common.js";
import { loadList, renderNews } from "./content.js";

const site = await loadSite();
renderLayout(site, "index.html");

// سلايدر الرسائل: كل سطر في لوحة التحكم = "العنوان | النص"
const slides = site.slides.split("\n").filter(Boolean).map((line) => {
  const [title, text = ""] = line.split("|").map((s) => s.trim());
  const slide = el("div", "slide");
  slide.append(el("h2", "font-head text-3xl md:text-5xl leading-snug", title), el("p", "mt-3 text-white/85 max-w-xl", text));
  return slide;
});
$("#slides").replaceChildren(...slides);
let index = 0;
slides[0]?.classList.add("on");
if (slides.length > 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  setInterval(() => {
    slides[index].classList.remove("on");
    index = (index + 1) % slides.length;
    slides[index].classList.add("on");
  }, 5000);
}

try {
  const stats = await getDoc(doc(db, "settings", "stats"));
  const d = stats.exists() ? stats.data() : {};
  $("#st-initiatives").textContent = d.initiatives ?? 0;
  $("#st-services").textContent = d.services ?? 0;
  $("#st-beneficiaries").textContent = d.beneficiaries ?? 0;
} catch { /* القيم الافتراضية */ }

renderNews($("#news"), await loadList("news", 3));
