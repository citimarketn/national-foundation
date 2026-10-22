import { $, el, clean, safeUrl, loadSite, renderLayout } from "./common.js";
import { renderForms } from "./forms.js";

const site = await loadSite();
renderLayout(site, "contact.html");
renderForms();

const info = $("#info");
[site.address, site.phone, site.email].filter(Boolean).forEach((line) => info.append(el("p", "text-sm", line)));

const tg = clean(site.telegram, 40).replace(/[^\w]/g, "");
const socials = [["يوتيوب", safeUrl(site.youtube)], ["فيسبوك", safeUrl(site.facebook)], ["إنستجرام", safeUrl(site.instagram)], ["تلجرام", tg && `https://t.me/${tg}`]];
for (const [label, url] of socials) {
  if (!url) continue;
  const a = el("a", "hover:underline", label);
  a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
  $("#social").append(a);
}
