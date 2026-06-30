/* Dental Mata · one-line website embed for ConfiDental Care.
   Install: <script src="https://YOUR_SERVER/embed.js" defer></script>
   It figures out your server URL automatically from this script's address. */
(function () {
  var me = document.currentScript || (function () { var s = document.getElementsByTagName('script'); return s[s.length - 1]; })();
  var BASE = new URL('.', me.src).href.replace(/\/$/, '');   // e.g. https://confidental-mata.onrender.com
  var API = BASE + '/chat';
  var LOGO = BASE + '/logo.jpg';

  // fonts (safe to add once)
  if (!document.getElementById('dm-font')) {
    var l = document.createElement('link'); l.id = 'dm-font'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700&family=Inter:wght@400;500;600&display=swap';
    document.head.appendChild(l);
  }

  var css = `
  .dm-launch{position:fixed;bottom:22px;right:22px;width:74px;height:74px;border-radius:50%;background:#A9DCF0;border:3px solid #fff;box-shadow:0 12px 28px rgba(31,134,184,.35);cursor:pointer;overflow:hidden;display:grid;place-items:center;animation:dm-bob 3.2s ease-in-out infinite;z-index:2147483000}
  .dm-launch:hover{transform:scale(1.06)}
  .dm-launch img{width:100%;height:100%;object-fit:cover;transform:scale(1.18) translateY(2px)}
  .dm-on{position:absolute;top:5px;right:7px;width:13px;height:13px;border-radius:50%;background:#34d27b;border:2.5px solid #fff}
  @keyframes dm-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
  .dm-panel{position:fixed;bottom:22px;right:22px;width:374px;max-width:calc(100vw - 32px);height:600px;max-height:calc(100vh - 44px);background:#fff;border-radius:24px;box-shadow:0 24px 64px rgba(24,80,120,.28);display:flex;flex-direction:column;overflow:hidden;border:1px solid #e8f1f6;z-index:2147483000;font-family:'Inter',system-ui,Arial,sans-serif;color:#21384A}
  .dm-head{background:linear-gradient(150deg,#A9DCF0,#6FBFE3);padding:16px 16px 18px;position:relative}
  .dm-head .dm-top{display:flex;align-items:center;gap:12px}
  .dm-ava{width:50px;height:50px;border-radius:16px;background:#fff;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.12);flex-shrink:0}
  .dm-ava img{width:100%;height:100%;object-fit:cover;transform:scale(1.16) translateY(1px)}
  .dm-head b{font-family:'Baloo 2',system-ui,sans-serif;font-size:19px;color:#fff;display:block;text-shadow:0 1px 2px rgba(0,0,0,.08);line-height:1.1;margin:0}
  .dm-sub{font-size:12px;color:#fff;opacity:.92;display:flex;align-items:center;gap:6px;margin-top:2px}
  .dm-sub i{width:7px;height:7px;border-radius:50%;background:#1f7a3f;box-shadow:0 0 0 2px rgba(255,255,255,.6)}
  .dm-min{position:absolute;top:14px;right:14px;width:28px;height:28px;border-radius:9px;background:rgba(255,255,255,.25);border:none;color:#fff;font-size:18px;cursor:pointer;line-height:1}
  .dm-stream{flex:1;overflow-y:auto;padding:18px 16px;display:flex;flex-direction:column;gap:11px;background:linear-gradient(180deg,#f5fbfe,#eef7fc)}
  .dm-m{max-width:84%;font-size:14px;line-height:1.5;padding:10px 13px;border-radius:16px;white-space:pre-wrap;animation:dm-pop .2s ease}
  @keyframes dm-pop{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
  .dm-bot{align-self:flex-start;background:#fff;border:1px solid #D7E8F1;border-bottom-left-radius:5px}
  .dm-me{align-self:flex-end;background:#1E86B8;color:#fff;border-bottom-right-radius:5px}
  .dm-chips{display:flex;flex-wrap:wrap;gap:7px;padding:2px 16px 0}
  .dm-chips button{font-family:'Inter',system-ui,Arial,sans-serif;font-size:12.5px;font-weight:500;background:#fff;border:1px solid #D7E8F1;color:#176A93;padding:7px 12px;border-radius:20px;cursor:pointer}
  .dm-chips button:hover{background:#1E86B8;color:#fff;border-color:#1E86B8}
  .dm-dots span{display:inline-block;width:6px;height:6px;border-radius:50%;background:#9fc4d6;margin:0 1px;animation:dm-bp 1.2s infinite}
  .dm-dots span:nth-child(2){animation-delay:.15s}.dm-dots span:nth-child(3){animation-delay:.3s}
  @keyframes dm-bp{0%,60%,100%{opacity:.3}30%{opacity:1}}
  .dm-form{display:flex;gap:8px;padding:12px;border-top:1px solid #D7E8F1;background:#fff;margin:0}
  .dm-form input{flex:1;border:1.5px solid #D7E8F1;border-radius:13px;padding:11px 14px;font-size:14px;font-family:'Inter',system-ui,Arial,sans-serif;outline:none;color:#21384A}
  .dm-form input:focus{border-color:#6FBFE3}
  .dm-send{width:46px;height:46px;border-radius:13px;background:#1E86B8;border:none;cursor:pointer;display:grid;place-items:center;flex-shrink:0}
  .dm-send:hover{background:#176A93}.dm-send:disabled{opacity:.45}
  .dm-send svg{width:18px;height:18px;stroke:#fff;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
  .dm-foot{text-align:center;font-size:10.5px;color:#5C7488;padding:0 0 9px;background:#fff}
  .dm-hidden{display:none!important}`;
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var root = document.createElement('div');
  root.innerHTML =
    '<button class="dm-launch" id="dm-launch" aria-label="Chat with Dental Mata"><span class="dm-on"></span><img src="' + LOGO + '" alt="Dental Mata"></button>' +
    '<div class="dm-panel dm-hidden" id="dm-panel">' +
      '<div class="dm-head"><div class="dm-top"><div class="dm-ava"><img src="' + LOGO + '" alt=""></div>' +
      '<div><b>Dental Mata</b><div class="dm-sub"><i></i>ConfiDental Care · online</div></div></div>' +
      '<button class="dm-min" id="dm-min" aria-label="Minimise">–</button></div>' +
      '<div class="dm-stream" id="dm-stream"></div>' +
      '<div class="dm-chips" id="dm-chips"></div>' +
      '<form class="dm-form" id="dm-form"><input id="dm-i" placeholder="Type your message…" autocomplete="off">' +
      '<button class="dm-send" type="submit" id="dm-send" aria-label="Send"><svg viewBox="0 0 24 24"><path d="M3 11 21 3l-8 18-2.5-7.5L3 11Z"/></svg></button></form>' +
      '<div class="dm-foot">Painless, modern dental care · Bidhannagar, Durgapur</div>' +
    '</div>';
  document.body.appendChild(root);

  var panel = root.querySelector('#dm-panel'), launch = root.querySelector('#dm-launch');
  var stream = root.querySelector('#dm-stream'), form = root.querySelector('#dm-form');
  var input = root.querySelector('#dm-i'), send = root.querySelector('#dm-send');
  var sid = 'web-' + (localStorage.getItem('dm_sid') || (localStorage.setItem('dm_sid', Math.random().toString(36).slice(2)), localStorage.getItem('dm_sid')));
  function add(t, who) { var d = document.createElement('div'); d.className = 'dm-m ' + who; d.textContent = t; stream.appendChild(d); stream.scrollTop = stream.scrollHeight; return d; }
  add("Namaste! 🦷👑 I'm Dental Mata, the front desk for ConfiDental Care. I can book your visit, answer questions about treatments and fees, or fast-track you if you're in pain. How can I help today?", 'dm-bot');
  var quick = ['Book a cleaning', 'I have a toothache', "What does a root canal cost?", 'Are you open Saturday?'];
  root.querySelector('#dm-chips').innerHTML = quick.map(function (q) { return '<button>' + q + '</button>'; }).join('');
  root.querySelectorAll('.dm-chips button').forEach(function (b) { b.onclick = function () { input.value = b.textContent; form.requestSubmit(); }; });
  launch.onclick = function () { panel.classList.remove('dm-hidden'); launch.classList.add('dm-hidden'); input.focus(); };
  root.querySelector('#dm-min').onclick = function () { panel.classList.add('dm-hidden'); launch.classList.remove('dm-hidden'); };
  form.onsubmit = async function (e) {
    e.preventDefault(); var text = input.value.trim(); if (!text) return; input.value = '';
    add(text, 'dm-me'); send.disabled = true;
    var t = add('', 'dm-bot'); t.innerHTML = '<span class="dm-dots"><span></span><span></span><span></span></span>';
    try {
      var r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sid, message: text }) });
      var data = await r.json(); t.textContent = data.reply;
    } catch (err) { t.textContent = "Sorry — I couldn't reach the clinic just now. Please call +91 9849878238."; }
    send.disabled = false; input.focus();
  };
})();
