import { loadSite, renderLayout } from "./common.js";
import { renderForms } from "./forms.js";

renderLayout(await loadSite(), "services.html");
renderForms();
