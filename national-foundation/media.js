import { $, loadSite, renderLayout } from "./common.js";
import { loadList, renderNews, renderPress, renderGallery } from "./content.js";

renderLayout(await loadSite(), "media.html");
const [news, press, gallery] = await Promise.all([loadList("news", 12), loadList("press", 20), loadList("gallery", 24)]);
renderNews($("#news"), news);
renderPress($("#press"), press);
renderGallery($("#gallery"), gallery);
