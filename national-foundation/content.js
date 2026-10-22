// تحميل وعرض الأخبار والبيانات الصحفية والمعرض
import { db } from "../../firebase-config.js";
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { el, safeUrl, formatDate } from "./common.js";

export async function loadList(name, max = 12) {
  try {
    const q = query(collection(db, name), orderBy("createdAt", "desc"), limit(max));
    return (await getDocs(q)).docs.map((d) => d.data());
  } catch {
    return [];
  }
}

const empty = (box, text) => box.append(el("p", "text-gray-500", text));

export function renderNews(box, items) {
  box.replaceChildren();
  if (!items.length) return empty(box, "لا توجد أخبار منشورة بعد.");
  for (const n of items) {
    const card = el("article", "border rounded overflow-hidden bg-white");
    if (safeUrl(n.imageUrl)) {
      const img = el("img", "h-44 w-full object-cover");
      img.src = n.imageUrl; img.alt = n.title || ""; img.loading = "lazy";
      card.append(img);
    }
    const body = el("div", "p-4");
    body.append(el("div", "text-xs text-gray-500", formatDate(n.createdAt)), el("h3", "font-bold text-royal mt-1", n.title),
      el("p", "text-sm mt-2 text-gray-700 whitespace-pre-line", n.body));
    card.append(body);
    box.append(card);
  }
}

export function renderPress(box, items) {
  box.replaceChildren();
  if (!items.length) return empty(box, "لا توجد بيانات صحفية بعد.");
  for (const p of items) {
    const li = el("li", "p-4");
    li.append(el("div", "text-xs text-gray-500", `${formatDate(p.createdAt)} — صادر عن المكتب الإعلامي`),
      el("b", "text-royal", p.title), el("p", "text-sm mt-1 text-gray-700 whitespace-pre-line", p.body));
    box.append(li);
  }
}

export function renderGallery(box, items) {
  box.replaceChildren();
  if (!items.length) return empty(box, "لا توجد وسائط بعد.");
  for (const g of items.filter((i) => safeUrl(i.url))) {
    const isVideo = g.mediaType === "video";
    const node = el(isVideo ? "video" : "img", "w-full h-36 object-cover rounded");
    node.src = g.url;
    if (isVideo) node.controls = true; else { node.alt = g.caption || "صورة من فعالية"; node.loading = "lazy"; }
    box.append(node);
  }
}
