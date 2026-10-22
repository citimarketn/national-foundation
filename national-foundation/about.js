import { $, el, loadSite, renderLayout } from "./common.js";

const site = await loadSite();
renderLayout(site, "about.html");

for (const key of ["chairmanWord", "vision", "mission", "goals"]) {
  $(`#${key}`).textContent = site[key] || "سيتم إضافة المحتوى قريبًا.";
}
const districts = site.districts.split("\n").map((s) => s.trim()).filter(Boolean);
$("#districts").replaceChildren(...districts.map((name) => el("div", "border rounded p-3", name)));
