// kiosk.js — persistent kiosk session manager
// Include on every page. Invisible until 10s warning popup.
// Activates only when ?worker= param is present (i.e. arrived via check scan).

(function() {
  const TIMEOUT    = 30;   // seconds before returning to kiosk
  const WARN_AT    = 10;   // seconds left when popup appears
  const KIOSK_URL  = 'https://kristof-j.github.io/nycwagetheft/kiosk.html';
  const SESSION_KEY = 'kioskSession';

  // Check if we're arriving fresh from a QR scan
  const params = new URLSearchParams(window.location.search);
  if(params.get('worker')) {
    // Store session in sessionStorage so it persists across page navigations
    sessionStorage.setItem(SESSION_KEY, 'active');
  }

  // Only run if a kiosk session is active
  if(sessionStorage.getItem(SESSION_KEY) !== 'active') return;

  let secondsLeft = TIMEOUT;
  let warningShown = false;
  let ticker;

  // ── Inject popup DOM ────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #kioskOverlay{
      display:none;position:fixed;inset:0;z-index:9999;
      background:rgba(0,0,0,0.6);
      align-items:center;justify-content:center;
    }
    #kioskOverlay.show{display:flex;}
    .ko-card{
      background:#fff;border-radius:10px;
      padding:32px 36px;text-align:center;
      max-width:320px;width:90%;
      box-shadow:0 20px 60px rgba(0,0,0,0.35);
      font-family:'DM Sans',system-ui,sans-serif;
    }
    .ko-title{
      font-family:'Playfair Display',Georgia,serif;
      font-size:1.5rem;font-weight:700;color:#111318;margin-bottom:8px;
    }
    .ko-sub{font-size:0.88rem;color:#667085;margin-bottom:24px;line-height:1.5;}
    .ko-sub strong{color:#111318;}
    .ko-stay{
      width:100%;font-family:'DM Sans',system-ui,sans-serif;
      font-size:0.88rem;font-weight:600;
      background:#111318;color:#fff;border:none;
      padding:13px;border-radius:6px;cursor:pointer;
      margin-bottom:10px;display:block;transition:background 0.15s;
    }
    .ko-stay:hover{background:#2c3347;}
    .ko-leave{
      width:100%;font-family:'DM Sans',system-ui,sans-serif;
      font-size:0.82rem;font-weight:500;
      background:none;color:#667085;
      border:1px solid #dee2ea;
      padding:11px;border-radius:6px;cursor:pointer;
      display:block;transition:all 0.15s;
    }
    .ko-leave:hover{color:#111318;border-color:#111318;}
    .ko-progress-wrap{
      height:3px;background:#dee2ea;border-radius:2px;
      overflow:hidden;margin-bottom:16px;
    }
    .ko-progress{
      height:100%;background:#5B8DEF;border-radius:2px;
      transition:width 1s linear;
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'kioskOverlay';
  overlay.innerHTML = `
    <div class="ko-card">
      <div class="ko-title">Are you still there?</div>
      <div class="ko-progress-wrap"><div class="ko-progress" id="koProgress" style="width:100%"></div></div>
      <div class="ko-sub">Returning to the scanner in <strong id="koCountdown">${WARN_AT}</strong> seconds.</div>
      <button class="ko-stay" id="koStay">Keep reading</button>
      <button class="ko-leave" id="koLeave">← Back to scanner</button>
    </div>`;
  document.body.appendChild(overlay);

  document.getElementById('koStay').onclick  = resetTimer;
  document.getElementById('koLeave').onclick = goToKiosk;

  // ── Timer ───────────────────────────────────────────────────────
  function startTimer() {
    clearInterval(ticker);
    ticker = setInterval(() => {
      secondsLeft--;

      // Show popup at warning threshold
      if(secondsLeft <= WARN_AT && !warningShown) {
        warningShown = true;
        overlay.classList.add('show');
      }

      // Update countdown in popup
      if(warningShown) {
        const el = document.getElementById('koCountdown');
        const pr = document.getElementById('koProgress');
        if(el) el.textContent = secondsLeft;
        if(pr) pr.style.width = (secondsLeft / WARN_AT * 100) + '%';
      }

      if(secondsLeft <= 0) {
        clearInterval(ticker);
        goToKiosk();
      }
    }, 1000);
  }

  function resetTimer() {
    secondsLeft = TIMEOUT;
    warningShown = false;
    overlay.classList.remove('show');
    const pr = document.getElementById('koProgress');
    if(pr) pr.style.width = '100%';
    startTimer();
  }

  function goToKiosk() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = KIOSK_URL;
  }

  // ── Reset on any interaction ────────────────────────────────────
  ['click','scroll','keydown','touchstart'].forEach(evt => {
    document.addEventListener(evt, () => {
      if(secondsLeft > WARN_AT) return; // only reset if we're in warning zone
      resetTimer();
    }, { passive: true });
  });

  // ── Start ───────────────────────────────────────────────────────
  startTimer();

})();
