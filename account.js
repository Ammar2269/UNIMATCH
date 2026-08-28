/* ---------------------------------------------------------------------------
   Local-only accounts.

   There is no server behind this site, so there is no real authentication here.
   An "account" is a name and an email kept in this browser's localStorage, and
   nothing else. Passwords are never stored, never transmitted, and never
   checked — there is nowhere to check them against. Anyone with access to this
   browser is signed in, and signing in on another device is not possible.

   This exists so the gated features have a real front-end flow to sit behind.
   When a backend arrives, replace the four functions below and the gate keeps
   working unchanged.
--------------------------------------------------------------------------- */

const ACCOUNT_KEY = 'unimatchAccount';

function getAccount(){
  try{
    const raw = localStorage.getItem(ACCOUNT_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}
function isSignedIn(){ return !!getAccount(); }
function signIn(account){
  try{ localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account)); }catch(e){}
  renderAccountNav();
}
function signOut(){
  try{ localStorage.removeItem(ACCOUNT_KEY); }catch(e){}
  renderAccountNav();
  location.reload();
}

/* ---------------- nav reflects signed-in state ---------------- */

function renderAccountNav(){
  const acct = getAccount();
  document.querySelectorAll('[data-when-signed-out]').forEach(el=>el.classList.toggle('hidden', !!acct));
  document.querySelectorAll('[data-when-signed-in]').forEach(el=>el.classList.toggle('hidden', !acct));
  const nameEl = document.getElementById('accountName');
  if(nameEl && acct) nameEl.textContent = acct.name || acct.email || 'Account';
}

/* ---------------- the gate ---------------- */

/* Returns true when the caller may proceed. When it returns false it has already
   shown the sign-up prompt, so the caller should simply stop. */
function requireAccount(featureName){
  if(isSignedIn()) return true;
  showAccountPrompt(featureName);
  return false;
}

function showAccountPrompt(featureName){
  let overlay = document.getElementById('accountPrompt');
  if(!overlay){
    overlay = document.createElement('div');
    overlay.id = 'accountPrompt';
    overlay.className = 'account-prompt';
    overlay.innerHTML = `
      <div class="account-prompt-card" role="dialog" aria-modal="true" aria-labelledby="accountPromptTitle">
        <button type="button" class="account-prompt-close" aria-label="Close">&#10005;</button>
        <span class="label">Members only</span>
        <h3 id="accountPromptTitle">Please create an account</h3>
        <p id="accountPromptBody"></p>
        <div class="account-prompt-actions">
          <a class="btn btn-primary" href="signup.html">Create an account <span class="arrow">&#8594;</span></a>
          <a class="btn btn-ghost" href="login.html">Log in</a>
        </div>
        <p class="account-prompt-note">Accounts are stored in this browser only — there is no server yet, so nothing is sent anywhere and nothing syncs between devices.</p>
      </div>`;
    document.body.appendChild(overlay);
    const close = ()=>overlay.classList.remove('open');
    overlay.querySelector('.account-prompt-close').onclick = close;
    overlay.addEventListener('click', e=>{ if(e.target===overlay) close(); });
    document.addEventListener('keydown', e=>{ if(e.key==='Escape') close(); });
  }
  const body = overlay.querySelector('#accountPromptBody');
  body.textContent = featureName
    ? `${featureName} is available to members. It takes a moment to sign up, and it costs nothing.`
    : 'This feature is available to members. It takes a moment to sign up, and it costs nothing.';
  overlay.classList.add('open');
  const first = overlay.querySelector('.btn');
  if(first) first.focus();
}

document.addEventListener('DOMContentLoaded', renderAccountNav);
renderAccountNav();
