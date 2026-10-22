// spaceclub.json's "look": turns the colours and footer settings into CSS for every page's
// <head>, and checks the layout choices. Only what a site sets is written out, so a site with
// no look settings looks exactly as styles.css draws it.

const THEME = ["primary", "secondary", "success", "info", "warning", "danger", "light", "dark"];
const MODES = ["light", "dark", "both"];
const LAYOUTS = ["classic", "centred", "split"];
const STARS = "/assets/stars.svg";

function rgb(hex, where) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) throw new Error(`spaceclub.json: ${where} should be a colour like "#d4204d", not ${JSON.stringify(hex)}`);
  let h = m[1];
  if (h.length === 3) h = h.replace(/./g, (c) => c + c);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

const toHex = (c) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
// a in the share of t, the rest b (as Bootstrap's own mix())
const mix = (a, b, t) => a.map((v, i) => v * t + b[i] * (1 - t));
const BLACK = [0, 0, 0];
const WHITE = [255, 255, 255];
const DARK_BG = [33, 37, 41]; // Bootstrap's dark mode body

// one mode's colours as CSS custom properties; dark gets lighter text shades, as Bootstrap does
function vars(colours, mode, prefix) {
  const out = [];
  const set = (name, c) => {
    out.push(`--bs-${name}: ${toHex(c)};`, `--bs-${name}-rgb: ${c.map(Math.round).join(", ")};`);
  };
  for (const name of THEME) {
    if (!colours[name]) continue;
    const c = rgb(colours[name], `${prefix}.${name}`);
    set(name, c);
    if (mode === "dark") {
      out.push(
        `--bs-${name}-text-emphasis: ${toHex(mix(c, WHITE, 0.6))};`,
        `--bs-${name}-bg-subtle: ${toHex(mix(c, DARK_BG, 0.2))};`,
        `--bs-${name}-border-subtle: ${toHex(mix(c, DARK_BG, 0.6))};`,
      );
    } else {
      out.push(
        `--bs-${name}-text-emphasis: ${toHex(mix(c, BLACK, 0.6))};`,
        `--bs-${name}-bg-subtle: ${toHex(mix(c, WHITE, 0.2))};`,
        `--bs-${name}-border-subtle: ${toHex(mix(c, WHITE, 0.6))};`,
      );
    }
  }
  if (colours.body) set("body-bg", rgb(colours.body, `${prefix}.body`));
  if (colours.text) set("body-color", rgb(colours.text, `${prefix}.text`));
  if (colours.border) out.push(`--bs-border-color: ${toHex(rgb(colours.border, `${prefix}.border`))};`);
  // links follow primary unless they have their own colour (and only once primary is set,
  // so a site with no colours keeps Bootstrap's links)
  const link = colours.link || colours.primary;
  if (link) {
    let c = rgb(link, `${prefix}.${colours.link ? "link" : "primary"}`);
    // on a dark page, a link that only follows primary takes primary's lighter shade
    if (mode === "dark" && !colours.link) c = mix(c, WHITE, 0.6);
    const hover = mode === "dark" ? mix(c, WHITE, 0.7) : mix(c, BLACK, 0.8);
    set("link-color", c);
    set("link-hover-color", hover);
  }
  return out;
}

function pick(value, allowed, fallback, where) {
  if (allowed.includes(value)) return value;
  if (value !== undefined && value !== null) {
    console.warn(`[spaceclub] spaceclub.json: ${where} should be one of ${allowed.join(", ")}, not ${JSON.stringify(value)}; using "${fallback}"`);
  }
  return fallback;
}

// the look with every choice checked, for templates (spaceclubLook.modes, .navbar.layout...)
function resolveLook(look) {
  const navbar = look.navbar || {};
  const footer = look.footer || {};
  // the divider above the footer: an SVG's path, or none
  let divider = footer.divider;
  if (divider === false || divider === "none") divider = null;
  else if (divider === "stars") divider = STARS;
  else if (typeof divider !== "string" || !divider.trim()) {
    if (divider !== undefined && divider !== null) {
      console.warn(`[spaceclub] spaceclub.json: look.footer.divider should be an SVG's path or "none", not ${JSON.stringify(divider)}; using ${STARS}`);
    }
    divider = STARS;
  }
  return {
    modes: pick(look.modes, MODES, "light", "look.modes"),
    navbar: {
      layout: pick(navbar.layout, LAYOUTS, "classic", "look.navbar.layout"),
      show: { logo: true, title: true, search: true, ...(navbar.show || {}) },
    },
    // the gradient footer, unless the site turns it off or gives its own background
    footer: {
      divider,
      gradient: footer.gradient !== false && !(footer.colours && footer.colours.background),
    },
  };
}

function lookCss(look) {
  const colours = look.colours || {};
  const light = colours.light || {};
  const dark = colours.dark || {};
  const footer = look.footer || {};
  const fc = footer.colours || {};
  const rules = [];

  const lightVars = vars(light, "light", "look.colours.light");
  // (not on a dark page, or a light body colour would show through Bootstrap's dark one)
  if (lightVars.length) rules.push(`:root:not([data-bs-theme=dark]), [data-bs-theme=light] { ${lightVars.join(" ")} }`);
  // dark mode keeps the site's brand colours unless it gives its own; body, text, links and
  // borders are left to dark mode's defaults
  const darkTheme = {};
  for (const name of THEME) if (light[name]) darkTheme[name] = light[name];
  const darkVars = vars({ ...darkTheme, ...dark, link: dark.link }, "dark", "look.colours.dark");
  if (darkVars.length) rules.push(`[data-bs-theme=dark] { ${darkVars.join(" ")} }`);

  const footerVars = [];
  if (fc.background) footerVars.push(`--sc-footer-bg: ${toHex(rgb(fc.background, "look.footer.colours.background"))};`, "--sc-footer-gradient: none;");
  else if (footer.gradient === false) footerVars.push("--sc-footer-gradient: none;");
  else if (footer.gradient !== undefined && footer.gradient !== null && footer.gradient !== true) {
    const stops = Array.isArray(footer.gradient) ? footer.gradient : [];
    if (stops.length < 2) throw new Error(`spaceclub.json: look.footer.gradient should be two or more colours like ["#3bc7f6", "#ef4444"], or false, not ${JSON.stringify(footer.gradient)}`);
    const hexes = stops.map((c, i) => toHex(rgb(c, `look.footer.gradient[${i}]`)));
    footerVars.push(`--sc-footer-gradient: linear-gradient(135deg, ${hexes.join(", ")});`);
  }
  if (fc.text) footerVars.push(`--sc-footer-text: ${toHex(rgb(fc.text, "look.footer.colours.text"))};`);
  const divider = resolveLook(look).footer.divider;
  if (footer.dividerLift !== undefined && footer.dividerLift !== null && footer.dividerLift !== 0) {
    const lift = Number(footer.dividerLift);
    if (!Number.isFinite(lift)) throw new Error(`spaceclub.json: look.footer.dividerLift should be a number like 20, not ${JSON.stringify(footer.dividerLift)}`);
    footerVars.push(`--divider-lift: ${lift}%;`);
  }
  if (divider && divider !== STARS) footerVars.push(`--divider-url: url(${JSON.stringify(divider.trim())});`);
  if (footerVars.length) rules.push(`:root { ${footerVars.join(" ")} }`);

  return rules.join("\n");
}

module.exports = { lookCss, resolveLook };
