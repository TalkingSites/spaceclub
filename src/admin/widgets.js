// Spacedash widgets: pickers that show the real thing instead of a name.
//   bs-icon    search Bootstrap Icons and click one
//   bs-swatch  choose a button style or colour, drawn as real buttons in the site's own CSS
(function () {
  var h = window.h;
  var ICONS_JSON = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.json";
  // the same stylesheets the site uses (layouts/base.njk), so swatches look exactly right
  var SITE_CSS = [
    "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
    "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css",
    "/assets/css/styles.css",
  ];

  var iconNames = null;
  function loadIcons() {
    if (!iconNames) iconNames = fetch(ICONS_JSON).then(function (r) { return r.json(); }).then(Object.keys);
    return iconNames;
  }


  // --- icon picker ---------------------------------------------------------------
  var IconControl = window.createClass({
    getInitialState: function () { return { names: [], query: "", open: false }; },
    componentDidMount: function () {
      var self = this;
      loadIcons().then(function (names) { self.setState({ names: names }); });
    },
    render: function () {
      var self = this;
      var value = this.props.value || "";
      var q = this.state.query.trim().toLowerCase();
      var matches = this.state.names.filter(function (n) { return !q || n.indexOf(q) !== -1; }).slice(0, 96);
      var link = { border: 0, background: "none", cursor: "pointer", color: "#3a69c7", font: "inherit", padding: 0 };
      if (!this.state.open) {
        return h("div", { className: this.props.classNameWrapper, style: { padding: 0, border: 0, display: "flex", gap: "14px", alignItems: "center" } },
          h("span", { style: { fontSize: "28px", width: "40px", textAlign: "center" } }, value ? h("i", { className: "bi bi-" + value }) : "–"),
          h("span", { style: { color: "#798291" } }, value || "No icon"),
          h("button", { type: "button", id: this.props.forID, style: link, onClick: function () { self.setState({ open: true }); } }, value ? "Change icon" : "Choose an icon"),
          value ? h("button", { type: "button", style: link, onClick: function () { self.props.onChange(""); } }, "Remove") : null
        );
      }
      return h("div", { className: this.props.classNameWrapper, style: { padding: 0, border: 0 } },
        h("div", { style: { display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" } },
          h("span", { style: { fontSize: "28px", width: "40px", textAlign: "center" } }, value ? h("i", { className: "bi bi-" + value }) : "–"),
          h("input", {
            type: "search", autoFocus: true, placeholder: value ? value + " (search to change)" : "Search icons, e.g. ticket, mail, calendar",
            value: this.state.query, onChange: function (e) { self.setState({ query: e.target.value }); },
            style: { flex: 1, padding: "8px 10px", border: "1px solid #dfdfe3", borderRadius: "6px", font: "inherit" },
          }),
          h("button", { type: "button", style: link, onClick: function () { self.setState({ open: false, query: "" }); } }, "Close")
        ),
        h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))", gap: "4px", maxHeight: "190px", overflowY: "auto", border: "1px solid #dfdfe3", borderRadius: "8px", padding: "10px", background: "#fff" } },
          matches.map(function (n) {
            var on = n === value;
            return h("button", {
              key: n, type: "button", title: n, "aria-label": n, "aria-pressed": on,
              onClick: function () { self.props.onChange(n); self.setState({ query: "", open: false }); },
              style: { height: "44px", fontSize: "20px", border: on ? "2px solid #3a69c7" : "1px solid #eee", borderRadius: "6px", background: on ? "#e8efff" : "#fff", cursor: "pointer" },
            }, h("i", { className: "bi bi-" + n }));
          })
        ),
        h("div", { style: { fontSize: "12px", color: "#798291", marginTop: "4px" } },
          "From Bootstrap Icons. ",
          h("a", { href: "https://icons.getbootstrap.com", target: "_blank", rel: "noreferrer" }, "Browse all icons")
        )
      );
    },
  });

  // --- style and colour picker -----------------------------------------------------
  // field.options: [{ label, value, className }]. Each option is drawn as a real button
  // inside a small frame that loads the site's CSS, and clicking it picks it.
  var SwatchControl = window.createClass({
    componentDidMount: function () { this.draw(); },
    componentDidUpdate: function () { this.draw(); },
    draw: function () {
      var frame = this.frame;
      if (!frame) return;
      var self = this;
      var options = this.props.field.get("options").toJS();
      var value = this.props.value || this.props.field.get("default");
      var html = '<!doctype html><html><head>' + SITE_CSS.map(function (c) { return '<link rel="stylesheet" href="' + c + '">'; }).join("") +
        '<style>body{background:transparent;margin:0;padding:6px 4px;display:flex;flex-wrap:wrap;gap:8px}.on{box-shadow:0 0 0 3px #fff,0 0 0 5px #3a69c7}</style></head><body>' +
        options.map(function (o) { return '<button type="button" data-v="' + o.value + '" class="btn ' + o.className + (o.value === value ? " on" : "") + '">' + o.label + "</button>"; }).join("") +
        "</body></html>";
      if (frame.dataset.html === html) return;
      frame.dataset.html = html;
      frame.srcdoc = html;
      frame.onload = function () {
        var doc = frame.contentDocument;
        doc.querySelectorAll("button").forEach(function (b) {
          b.addEventListener("click", function () { self.props.onChange(b.dataset.v); });
        });
        frame.style.height = doc.body.scrollHeight + 4 + "px";
      };
    },
    render: function () {
      var self = this;
      return h("div", { className: this.props.classNameWrapper, style: { padding: "4px 0", border: 0 } },
        h("iframe", { ref: function (el) { self.frame = el; }, title: this.props.field.get("label"), style: { width: "100%", height: "52px", border: 0, display: "block" } })
      );
    },
  });

  CMS.registerWidget("bs-icon", IconControl, function (props) { return h("i", { className: "bi bi-" + props.value }); });
  CMS.registerWidget("bs-swatch", SwatchControl);
})();
