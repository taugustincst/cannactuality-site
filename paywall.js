/* CannActuality soft paywall — metered access for research briefs.
 *
 * Model (set by Tj, 2026-11-11): each reader gets 1 free brief. After that,
 * a brief can be bought individually or unlocked with an all-access
 * subscription. Payments run through Stripe payment links; prices appear
 * only on Stripe's checkout pages, never on this site.
 *
 * State is kept in localStorage on the reader's browser (soft paywall:
 * a friction gate, not a vault — the brief text stays in the page for
 * search indexing). Keys:
 *   ca_pw_free         slug of the brief used as the free one
 *   ca_pw_owned        JSON array of purchased brief slugs
 *   ca_pw_sub          "1" when this browser has an all-access subscription
 *   ca_pw_pending      slug whose purchase is in flight (set at checkout click)
 *   ca_pw_pending_sub  "1" when a subscription checkout is in flight
 *
 * Activation: the wall stays OFF until both Stripe payment links are set
 * below. Fill in CA_BUY_LINK / CA_SUB_LINK and push — no other change needed.
 * The Stripe links must redirect after payment to:
 *   buy:        https://cannactuality.com/unlock.html?paid=brief
 *   subscribe:  https://cannactuality.com/unlock.html?paid=sub
 */
(function () {
  var CA_BUY_LINK = "";
  var CA_SUB_LINK = "";

  if (!CA_BUY_LINK || !CA_SUB_LINK) return; // paywall inactive until links exist
  if (location.pathname.indexOf("/briefs/") === -1) return;

  var slug = location.pathname.split("/").pop().replace(/\.html$/, "");
  var K = {
    free: "ca_pw_free",
    owned: "ca_pw_owned",
    sub: "ca_pw_sub",
    pending: "ca_pw_pending",
    pendingSub: "ca_pw_pending_sub"
  };
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function owned() {
    try { return JSON.parse(get(K.owned) || "[]"); } catch (e) { return []; }
  }
  function hasAccess() {
    if (get(K.sub) === "1") return "sub";
    if (owned().indexOf(slug) !== -1) return "owned";
    return null;
  }

  var css = [
    ".ca-pw-note{margin:14px 0;padding:10px 14px;border:1px solid #C79A2E;border-radius:8px;",
    "background:#FBF6E9;color:#14261B;font-size:14px;line-height:1.45}",
    ".ca-pw-note a{color:#173F2C;font-weight:600}",
    ".ca-pw-fade{position:relative}",
    ".ca-pw-wall{margin:26px 0;padding:26px 24px;border:2px solid #173F2C;border-radius:12px;",
    "background:#173F2C;color:#F4F1E8;text-align:left}",
    ".ca-pw-wall h2{margin:0 0 8px;font-size:22px;color:#fff}",
    ".ca-pw-wall p{margin:0 0 14px;font-size:15px;line-height:1.55;color:#E8E4D8}",
    ".ca-pw-btns{display:flex;flex-wrap:wrap;gap:10px}",
    ".ca-pw-btn{display:inline-block;padding:11px 18px;border-radius:8px;border:0;cursor:pointer;",
    "font-size:15px;font-weight:700;text-decoration:none}",
    ".ca-pw-btn-buy{background:#C79A2E;color:#14261B}",
    ".ca-pw-btn-sub{background:#fff;color:#173F2C}",
    ".ca-pw-fine{margin-top:12px;font-size:12.5px;color:#B9BCA9}"
  ].join("");
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  function goBuy() {
    set(K.pending, slug);
    location.href = CA_BUY_LINK;
  }
  function goSub() {
    set(K.pendingSub, "1");
    location.href = CA_SUB_LINK;
  }
  function wire(scope) {
    var b = scope.querySelector("[data-ca-buy]");
    var s = scope.querySelector("[data-ca-sub]");
    if (b) b.addEventListener("click", function (e) { e.preventDefault(); goBuy(); });
    if (s) s.addEventListener("click", function (e) { e.preventDefault(); goSub(); });
  }

  var body = document.querySelector(".brief-body");
  if (!body) return;

  var access = hasAccess();
  if (access) {
    var note = document.createElement("div");
    note.className = "ca-pw-note";
    note.innerHTML = access === "sub"
      ? "You have all-access subscriber status on this browser — every brief is open."
      : "You own this brief — it stays open on this browser.";
    body.insertBefore(note, body.children[3] || null);
    return;
  }

  var freeSlug = get(K.free);
  if (!freeSlug) {
    set(K.free, slug);
    freeSlug = slug;
  }
  if (freeSlug === slug) {
    var freeNote = document.createElement("div");
    freeNote.className = "ca-pw-note";
    freeNote.innerHTML =
      "This is your <strong>1 free brief</strong>. Every other brief is for " +
      "subscribers, or can be bought on its own. " +
      '<a href="#" data-ca-sub>Subscribe for all-access &rarr;</a>';
    body.insertBefore(freeNote, body.children[3] || null);
    wire(freeNote);
    return;
  }

  // Gated: show everything through the first <h2> section, hide the rest.
  var kids = Array.prototype.slice.call(body.children);
  var h2seen = 0;
  var lastVisible = null;
  kids.forEach(function (el) {
    if (el.tagName === "H2") h2seen++;
    if (h2seen >= 2) {
      el.style.display = "none";
    } else {
      lastVisible = el;
    }
  });
  if (lastVisible) lastVisible.classList.add("ca-pw-fade");

  var wall = document.createElement("div");
  wall.className = "ca-pw-wall";
  wall.innerHTML =
    "<h2>Keep reading with CannActuality access</h2>" +
    "<p>You have already used your free brief. This brief — and the full " +
    "research library behind it — is available to subscribers, or you can " +
    "buy just this one.</p>" +
    '<div class="ca-pw-btns">' +
    '<a class="ca-pw-btn ca-pw-btn-buy" href="#" data-ca-buy>Buy this brief</a>' +
    '<a class="ca-pw-btn ca-pw-btn-sub" href="#" data-ca-sub>Subscribe — all-access</a>' +
    "</div>" +
    '<p class="ca-pw-fine">Checkout opens on Stripe, where the price is shown ' +
    "before you pay. Access is remembered on this browser after checkout.</p>";
  var section = body.closest ? body.closest("section") : body.parentElement;
  if (section && section.parentNode) {
    section.parentNode.insertBefore(wall, section.nextSibling);
  } else {
    body.appendChild(wall);
  }
  wire(wall);
})();
