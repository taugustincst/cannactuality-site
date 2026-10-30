/* lead.js — shared lead messenger + info-request forms for AugustInnovations sites.
   Primary delivery: FormSubmit AJAX POST (no account; submissions land in the
   owner's inbox). Automatic fallback if that fails: the visitor's own email
   app (mailto compose) plus a copy-to-clipboard fallback. */
(function () {
  'use strict';
  var script = document.currentScript;
  if (!script) return;

  function attr(el, name, fallback) {
    var v = el.getAttribute(name);
    return (v === null || v === '') ? fallback : v;
  }

  var cfg = {
    inbox: attr(script, 'data-inbox', ''),
    brand: attr(script, 'data-brand', 'Contact us'),
    site: attr(script, 'data-site', window.location.hostname),
    interests: attr(script, 'data-interests', 'General inquiry').split('|'),
    interest: attr(script, 'data-interest', ''),
    head: attr(script, 'data-head', '#16324A'),
    accent: attr(script, 'data-accent', '#C9902E'),
    accentInk: attr(script, 'data-accent-ink', '#0F2436'),
    seed: attr(script, 'data-seed', ''),
    seedInterest: attr(script, 'data-seed-interest', '')
  };

  var SEEDS = {
    'cp-scoping':
      '1. What application is being tested, and what does it do?\n\n' +
      '2. What data does it handle (PHI, PII, payment)?\n\n' +
      '3. Why is the test needed now (buyer requirement, HIPAA, SOC 2, other)?\n\n' +
      '4. Is there a staging environment with synthetic data?\n\n' +
      '5. How many user roles exist, and can test accounts be provided for each?\n\n' +
      '6. Is codebase or architecture documentation available to share?\n\n' +
      '7. What deliverable do you need (report, attestation, both)?\n\n' +
      '8. Who would sign the testing authorization?\n\n' +
      '9. What is driving your deadline?\n'
  };

  /* ---------- styles ---------- */
  var css = '' +
  '.lm-bubble{position:fixed;right:20px;bottom:20px;z-index:99990;background:' + cfg.accent + ';color:' + cfg.accentInk + ';border:none;border-radius:999px;padding:13px 20px;font-family:-apple-system,\'Segoe UI\',Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;box-shadow:0 6px 20px rgba(0,0,0,.28);cursor:pointer}' +
  '.lm-bubble:hover{filter:brightness(1.07)}' +
  '.lm-backdrop{position:fixed;inset:0;background:rgba(10,15,20,.45);z-index:99991}' +
  '.lm-panel{position:fixed;right:20px;bottom:20px;z-index:99992;width:min(392px,calc(100vw - 24px));max-height:min(86vh,720px);overflow-y:auto;background:#fff;border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.35);font-family:-apple-system,\'Segoe UI\',Helvetica,Arial,sans-serif;color:#1C2733}' +
  '.lm-head{background:' + cfg.head + ';color:#fff;padding:15px 18px;display:flex;align-items:center;justify-content:space-between;border-radius:16px 16px 0 0}' +
  '.lm-head .lm-brand{font-weight:800;font-size:16.5px}' +
  '.lm-close{background:none;border:none;color:#fff;font-size:24px;line-height:1;cursor:pointer;padding:2px 6px}' +
  '.lm-body{padding:16px 18px 18px}' +
  '.lm-greet{margin:0 0 12px;color:#54655E;font-size:14.5px}' +
  '@media (max-width:480px){.lm-panel{right:12px;bottom:12px}.lm-bubble{right:12px;bottom:12px}}' +
  /* shared form styles (panel + embedded) */
  '.lf-field{display:block;margin:0 0 12px}' +
  '.lf-field>span{display:block;font-family:-apple-system,\'Segoe UI\',Helvetica,Arial,sans-serif;font-size:13.5px;font-weight:700;margin-bottom:5px;color:inherit}' +
  '.lf-field input,.lf-field select,.lf-field textarea{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #C9CFd6;border:1px solid var(--line,#C9CFD6);border-radius:8px;font:inherit;font-size:15px;background:#fff;color:#1C2733}' +
  '.lf-field textarea{resize:vertical}' +
  '.lf-field [aria-invalid="true"]{border-color:#B3261E;outline:1px solid #B3261E}' +
  '.lf-error{display:block;color:#B3261E;font-size:13px;font-weight:600;margin-top:4px}' +
  '.lf-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 14px}' +
  '@media (max-width:640px){.lf-grid{grid-template-columns:1fr}}' +
  '.lf-send{background:' + cfg.accent + ';color:' + cfg.accentInk + ';border:none;border-radius:9px;padding:12px 26px;font-family:-apple-system,\'Segoe UI\',Helvetica,Arial,sans-serif;font-weight:700;font-size:15.5px;cursor:pointer}' +
  '.lf-send:hover{filter:brightness(1.07)}' +
  '.lf-note{font-size:13px;color:#6B7280;margin:10px 0 0}' +
  '.lead-form{background:var(--card,#fff);border:1px solid var(--line,#DDE5E0);border-radius:var(--radius,14px);padding:24px 26px;margin-top:8px;text-align:left}' +
  '.lead-confirm{background:var(--card,#fff);border:1px solid var(--line,#DDE5E0);border-radius:var(--radius,14px);padding:24px 26px;margin-top:8px}' +
  '.lm-panel .lead-confirm{border:none;padding:4px 0 0;margin-top:0}' +
  '.lead-confirm h3{margin:0 0 8px;font-size:19px}' +
  '.lead-confirm p{margin:0 0 10px;font-size:15.5px}' +
  '.lf-copy{background:#fff;border:1.5px solid ' + cfg.accent + ';color:#1C2733;border-radius:8px;padding:9px 18px;font-family:-apple-system,\'Segoe UI\',Helvetica,Arial,sans-serif;font-weight:700;font-size:14.5px;cursor:pointer}' +
  '.lf-copied{color:#11604F;font-weight:700;font-size:14px;margin-left:10px}';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- shared lead logic ---------- */
  var FORMSUBMIT_ENDPOINT = 'https://formsubmit.co/ajax/4be796ed0f91bce36114d479ca4bb566';
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function fieldError(input, msg) {
    var wrap = input.closest('.lf-field');
    if (!wrap) return;
    var err = wrap.querySelector('.lf-error');
    if (msg) {
      if (!err) {
        err = document.createElement('span');
        err.className = 'lf-error';
        err.setAttribute('role', 'alert');
        wrap.appendChild(err);
      }
      err.textContent = msg;
      input.setAttribute('aria-invalid', 'true');
    } else {
      if (err) err.remove();
      input.removeAttribute('aria-invalid');
    }
  }

  function validateAndRead(form) {
    var values = {};
    var firstBad = null;
    function grab(name, required, isEmail) {
      var input = form.querySelector('[name="' + name + '"]');
      if (!input) { values[name] = ''; return; }
      var v = input.value.trim();
      values[name] = v;
      var msg = '';
      if (required && !v) msg = 'This field is required.';
      else if (isEmail && v && !EMAIL_RE.test(v)) msg = 'Please enter a valid email address.';
      fieldError(input, msg);
      if (msg && !firstBad) firstBad = input;
    }
    grab('name', true, false);
    grab('email', true, true);
    grab('org', false, false);
    grab('interest', false, false);
    grab('message', true, false);
    if (firstBad) { firstBad.focus(); return null; }
    return values;
  }

  function compose(ctx, values) {
    var subject = 'New lead — ' + ctx.site + ' (' + (values.interest || 'General inquiry') + ')';
    var lines = [
      'Name: ' + values.name,
      'Email: ' + values.email
    ];
    if (values.org) lines.push('Organization: ' + values.org);
    lines.push('Interest: ' + (values.interest || 'General inquiry'));
    lines.push('');
    lines.push(values.message);
    var body = lines.join('\n');
    return {
      subject: subject,
      body: body,
      mailto: 'mailto:' + ctx.inbox + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body),
      copyText: 'To: ' + ctx.inbox + '\nSubject: ' + subject + '\n\n' + body
    };
  }

  function showConfirmation(container, ctx, lead) {
    container.innerHTML = '';
    var box = document.createElement('div');
    box.className = 'lead-confirm';
    var h = document.createElement('h3');
    h.textContent = 'Thanks — your message is ready to send';
    var p1 = document.createElement('p');
    p1.textContent = 'Your email app should open with your message ready — just press send there.';
    var p2 = document.createElement('p');
    p2.innerHTML = 'No email app opened? You can also reach us at ';
    var a = document.createElement('a');
    a.href = 'mailto:' + ctx.inbox;
    a.textContent = ctx.inbox;
    p2.appendChild(a);
    p2.appendChild(document.createTextNode(', or copy your message and paste it into any email:'));
    var btnRow = document.createElement('p');
    var copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'lf-copy';
    copyBtn.textContent = 'Copy my message';
    var copied = document.createElement('span');
    copied.className = 'lf-copied';
    copied.hidden = true;
    copied.textContent = 'Copied ✓';
    copyBtn.addEventListener('click', function () {
      function done() { copied.hidden = false; }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(lead.copyText).then(done, function () { fallbackCopy(); done(); });
      } else { fallbackCopy(); done(); }
      function fallbackCopy() {
        var ta = document.createElement('textarea');
        ta.value = lead.copyText;
        ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
      }
    });
    btnRow.appendChild(copyBtn);
    btnRow.appendChild(copied);
    box.appendChild(h); box.appendChild(p1); box.appendChild(p2); box.appendChild(btnRow);
    container.appendChild(box);
    return box;
  }

  function showSentConfirmation(container, ctx) {
    container.innerHTML = '';
    var box = document.createElement('div');
    box.className = 'lead-confirm';
    var h = document.createElement('h3');
    h.textContent = 'Message sent — we\'ll reply by email.';
    var p = document.createElement('p');
    p.textContent = 'Thanks for getting in touch — your message is on its way to our inbox.';
    box.appendChild(h); box.appendChild(p);
    container.appendChild(box);
    return box;
  }

  function maybeSeed(form, seedKey, seedInterest) {
    if (!seedKey || !SEEDS[seedKey]) return;
    var sel = form.querySelector('[name="interest"]');
    var ta = form.querySelector('[name="message"]');
    if (!sel || !ta) return;
    if (sel.value === seedInterest && ta.value.trim() === '') {
      ta.value = SEEDS[seedKey];
    }
  }

  function bindLeadForm(form, ctx) {
    if (form.dataset.leadBound) return;
    form.dataset.leadBound = '1';
    maybeSeed(form, ctx.seed, ctx.seedInterest);
    var sel = form.querySelector('[name="interest"]');
    if (sel) {
      sel.addEventListener('change', function () { maybeSeed(form, ctx.seed, ctx.seedInterest); });
    }
    form.querySelectorAll('input,select,textarea').forEach(function (input) {
      input.addEventListener('input', function () { fieldError(input, ''); });
    });
    var sending = false;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending) return;
      var values = validateAndRead(form);
      if (!values) return;
      var lead = compose(ctx, values);
      var sendBtn = form.querySelector('button[type="submit"]');
      function swapIn(buildFn) {
        var parent = form.parentNode;
        form.hidden = true;
        var holder = document.createElement('div');
        parent.insertBefore(holder, form.nextSibling);
        buildFn(holder);
        holder.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
      function fallback() {
        window.location.href = lead.mailto;
        swapIn(function (holder) { showConfirmation(holder, ctx, lead); });
      }
      if (!window.fetch) { fallback(); return; }
      sending = true;
      if (sendBtn) sendBtn.disabled = true;
      var payload = {
        name: values.name,
        email: values.email,
        _replyto: values.email,
        organization: values.org,
        interest: values.interest || 'General inquiry',
        message: values.message,
        _subject: lead.subject,
        _template: 'table',
        _captcha: 'false'
      };
      fetch(FORMSUBMIT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error('http ' + res.status);
        return res.json();
      }).then(function (data) {
        if (data && (data.success === true || data.success === 'true')) {
          swapIn(function (holder) { showSentConfirmation(holder, ctx); });
        } else {
          fallback();
        }
      }).catch(function () {
        fallback();
      });
    });
  }

  /* ---------- embedded info-request forms ---------- */
  document.querySelectorAll('form[data-lead-form]').forEach(function (form) {
    bindLeadForm(form, {
      inbox: attr(form, 'data-inbox', cfg.inbox),
      site: attr(form, 'data-site', cfg.site),
      seed: attr(form, 'data-seed', ''),
      seedInterest: attr(form, 'data-seed-interest', '')
    });
  });

  /* ---------- messenger panel ---------- */
  var lastFocus = null;

  var bubble = document.createElement('button');
  bubble.type = 'button';
  bubble.className = 'lm-bubble';
  bubble.textContent = '💬 Message us';
  bubble.setAttribute('aria-label', 'Open the message form');
  bubble.setAttribute('aria-haspopup', 'dialog');
  document.body.appendChild(bubble);

  var backdrop = document.createElement('div');
  backdrop.className = 'lm-backdrop';
  backdrop.hidden = true;
  document.body.appendChild(backdrop);

  var panel = document.createElement('div');
  panel.className = 'lm-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', 'Send us a message');
  panel.hidden = true;

  var head = document.createElement('div');
  head.className = 'lm-head';
  var brandEl = document.createElement('span');
  brandEl.className = 'lm-brand';
  brandEl.textContent = cfg.brand;
  var closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'lm-close';
  closeBtn.textContent = '×';
  closeBtn.setAttribute('aria-label', 'Close the message form');
  head.appendChild(brandEl);
  head.appendChild(closeBtn);
  panel.appendChild(head);

  var bodyWrap = document.createElement('div');
  bodyWrap.className = 'lm-body';
  var greet = document.createElement('p');
  greet.className = 'lm-greet';
  greet.textContent = 'Send us a message — we reply by email.';
  bodyWrap.appendChild(greet);

  var pform = document.createElement('form');
  pform.className = 'lm-form';
  pform.setAttribute('novalidate', '');
  var optionsHtml = cfg.interests.map(function (i) {
    return '<option value="' + i.replace(/"/g, '&quot;') + '">' + i + '</option>';
  }).join('');
  pform.innerHTML =
    '<label class="lf-field"><span>Your name *</span><input type="text" name="name" autocomplete="name" required></label>' +
    '<label class="lf-field"><span>Email *</span><input type="email" name="email" autocomplete="email" required></label>' +
    '<label class="lf-field"><span>Organization (optional)</span><input type="text" name="org" autocomplete="organization"></label>' +
    '<label class="lf-field"><span>I\'m interested in</span><select name="interest">' + optionsHtml + '</select></label>' +
    '<label class="lf-field"><span>Message *</span><textarea name="message" rows="6" required></textarea></label>' +
    '<button type="submit" class="lf-send">Send message</button>' +
    '<p class="lf-note">Press send and your message goes straight to our inbox.</p>';
  bodyWrap.appendChild(pform);
  panel.appendChild(bodyWrap);
  document.body.appendChild(panel);

  bindLeadForm(pform, { inbox: cfg.inbox, site: cfg.site, seed: cfg.seed, seedInterest: cfg.seedInterest });

  var pSel = pform.querySelector('[name="interest"]');
  if (pSel && cfg.interest && cfg.interests.indexOf(cfg.interest) !== -1) {
    pSel.value = cfg.interest;
    maybeSeed(pform, cfg.seed, cfg.seedInterest);
  }

  function openPanel(interest) {
    lastFocus = document.activeElement;
    if (interest && pSel && cfg.interests.indexOf(interest) !== -1) {
      pSel.value = interest;
      maybeSeed(pform, cfg.seed, cfg.seedInterest);
    }
    pform.hidden = false;
    greet.hidden = false;
    var old = bodyWrap.querySelector('.lead-confirm');
    if (old) old.parentNode.remove();
    panel.hidden = false;
    backdrop.hidden = false;
    bubble.hidden = true;
    var first = pform.querySelector('[name="name"]');
    if (first) first.focus();
  }

  function closePanel() {
    panel.hidden = true;
    backdrop.hidden = true;
    bubble.hidden = false;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  bubble.addEventListener('click', function () { openPanel(null); });
  closeBtn.addEventListener('click', closePanel);
  backdrop.addEventListener('click', closePanel);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) closePanel();
  });

  document.querySelectorAll('[data-lead-open]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      openPanel(el.getAttribute('data-lead-interest'));
    });
  });
})();
