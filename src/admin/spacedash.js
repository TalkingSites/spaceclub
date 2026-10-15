// Spacedash touches on Decap's screens. Decap's GitHub backend labels its button
// "Login with GitHub", but sign-in here is Authentik (see server.js), so relabel it
// and add sign-up and password reset links underneath.
(function () {
  var AUTH = "https://auth.talkingsites.org/if/flow/";
  var LINKS = [
    { text: "Create account", href: AUTH + "ew-self-enrol/" },
    { text: "Forgot password", href: AUTH + "default-recovery-flow/" },
  ];

  function extras() {
    var box = document.createElement("div");
    box.style.cssText = "display:flex;justify-content:center;gap:18px;margin:10px 0 0;font-size:14px";
    LINKS.forEach(function (l) {
      var a = document.createElement("a");
      a.href = l.href;
      a.target = "_blank";
      a.rel = "noreferrer";
      a.textContent = l.text;
      a.style.cssText = "color:#3a69c7;font-weight:500";
      box.appendChild(a);
    });
    return box;
  }

  // Decap's own "Go back to site" link sits well below; pull it up next to ours
  // Decap's "Go back to site" (an arrow icon plus text) has margin-top 50px and 10px
  // padding; pull it up so it sits just under our links
  function tightenBackLink() {
    document.querySelectorAll("a").forEach(function (a) {
      if (a.dataset.spacedash || a.textContent.trim() !== "Go back to site") return;
      a.dataset.spacedash = "1";
      a.style.marginTop = "4px";
      a.style.paddingTop = "4px";
    });
  }

  function relabel() {
    tightenBackLink();
    document.querySelectorAll("button").forEach(function (button) {
      if (button.dataset.spacedash || button.textContent.trim() !== "Login with GitHub") return;
      button.dataset.spacedash = "1";
      button.querySelectorAll("svg").forEach(function (icon) { icon.remove(); });
      button.textContent = "Log In";
      // bigger than Decap's default, but keeps Decap's own colours
      button.style.fontSize = "18px";
      button.style.padding = "8px 42px";
      button.style.height = "auto";
      button.insertAdjacentElement("afterend", extras());
    });
  }
  // Decap's blocks (editor components) have no remove button. Add a ✕ to each one's
  // top bar: it selects the block in the editor, then deletes it like Backspace does.
  // React keeps each element's props on the DOM node; walk up to find a prop.
  function findProp(el, test) {
    var key = Object.keys(el).find(function (k) { return k.indexOf("__reactFiber$") === 0; });
    for (var f = key && el[key], i = 0; f && i < 60; f = f.return, i++) {
      if (f.memoizedProps && test(f.memoizedProps)) return f.memoizedProps;
    }
    return null;
  }

  function pathTo(children, node, path) {
    for (var i = 0; i < children.length; i++) {
      if (children[i] === node) return path.concat(i);
      if (children[i].children) {
        var found = pathTo(children[i].children, node, path.concat(i));
        if (found) return found;
      }
    }
    return null;
  }

  // Removes a block straight from Decap's Slate editor with a "remove_node" operation
  function removeBlock(block) {
    var editorEl = block.closest("[data-slate-editor]");
    var host = editorEl && findProp(editorEl, function (p) { return p.editor && typeof p.editor.apply === "function"; });
    var own = findProp(block, function (p) { return p.element && p.element.type; });
    if (!host || !own) return false;
    var editor = host.editor;
    var path = pathTo(editor.children, own.element, []);
    if (!path) return false;
    editor.apply({ type: "remove_node", path: path, node: own.element });
    return true;
  }

  function addRemoveButtons() {
    document.querySelectorAll('[data-slate-editor] [data-slate-void="true"]').forEach(function (block) {
      if (block.querySelector(".spacedash-remove")) return;
      // the card's own top bar (Decap's styled "TopBar"), so the ✕ sits on the card
      var bar = block.querySelector('[class*="TopBar"]:not([class*="TopBarButton"])') || block;
      var x = document.createElement("button");
      x.type = "button";
      x.className = "spacedash-remove";
      x.textContent = "✕";
      x.title = "Remove this block";
      x.setAttribute("aria-label", "Remove this block");
      x.setAttribute("contenteditable", "false");
      // at the right end of the bar, vertically centred
      x.style.cssText = "position:absolute;top:50%;right:8px;transform:translateY(-50%);z-index:2;border:0;background:none;cursor:pointer;color:#c0392b;font-size:15px;line-height:1;padding:2px 4px";
      if (getComputedStyle(bar).position === "static") bar.style.position = "relative";
      x.addEventListener("mousedown", function (e) { e.preventDefault(); e.stopPropagation(); });
      x.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm("Remove this block?")) return;
        if (!removeBlock(block)) window.alert("Sorry, couldn't remove that block. Click it and press Backspace instead.");
      });
      bar.appendChild(x);
    });
  }

  new MutationObserver(function () { relabel(); addRemoveButtons(); }).observe(document.documentElement, { childList: true, subtree: true });
  relabel();
  addRemoveButtons();
})();
