/* ---------------- Mobile nav drawer ----------------
   The button is injected rather than written into all four pages, and it is
   display:none above the mobile breakpoint, so desktop is untouched. */

(function initNavDrawer(){
  const nav=document.querySelector('nav');
  const right=nav&&nav.querySelector('.nav-right');
  if(!nav||!right)return;

  const btn=document.createElement('button');
  btn.type='button';
  btn.className='nav-toggle';
  btn.setAttribute('aria-label','Menu');
  btn.setAttribute('aria-expanded','false');
  btn.innerHTML='<span></span><span></span><span></span>';
  nav.appendChild(btn);

  const setOpen=(on)=>{
    nav.classList.toggle('open',on);
    btn.setAttribute('aria-expanded',on?'true':'false');
  };

  btn.addEventListener('click',e=>{e.stopPropagation();setOpen(!nav.classList.contains('open'));});
  // a tapped link should close the drawer behind it
  right.addEventListener('click',e=>{if(e.target.closest('a'))setOpen(false);});
  document.addEventListener('click',e=>{if(!nav.contains(e.target))setOpen(false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false);});
  // leaving the mobile breakpoint must not strand the drawer open
  window.matchMedia('(min-width:721px)').addEventListener('change',ev=>{if(ev.matches)setOpen(false);});
})();

/* ---------------- Coverage hint: tap to expand on small screens ----------------
   The clamp itself is CSS and only applies at the mobile breakpoint, so this
   listener is inert on desktop. */

(function initHintToggle(){
  const hint=document.getElementById('subjectHint');
  if(!hint)return;
  const btn=document.createElement('button');
  btn.type='button';
  btn.className='hint-toggle';
  btn.textContent='Show the full list';
  hint.insertAdjacentElement('afterend',btn);
  btn.addEventListener('click',()=>{
    const open=hint.classList.toggle('expanded');
    btn.textContent=open?'Show less':'Show the full list';
  });
})();

/* ---------------- Sign out ---------------- */

(function initSignOut(){
  const btn=document.getElementById('signOutBtn');
  if(btn && typeof signOut==='function')btn.onclick=signOut;
})();

/* ---------------- Reveal-on-scroll ---------------- */

(function initReveal(){
  const items=document.querySelectorAll('.reveal');
  if(!items.length)return;
  if(document.documentElement.classList.contains('no-motion')||!('IntersectionObserver' in window)){
    items.forEach(el=>el.classList.add('in'));
    return;
  }
  const io=new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('in');io.unobserve(entry.target);}
    });
  },{rootMargin:'0px 0px -12% 0px',threshold:.08});
  items.forEach(el=>io.observe(el));
})();

/* ---------------- Settings panel: theme picker (Light / Dark) ---------------- */

const THEMES=[
  {value:'light',label:'Light'},
  {value:'dark',label:'Dark'}
];
function applySettingsUI(theme){
  document.querySelectorAll('.theme-option').forEach(btn=>{
    btn.classList.toggle('active', btn.dataset.themeChoice===theme);
  });
}
const settingsToggleBtn=document.getElementById('settingsToggle');
const settingsPanel=document.getElementById('settingsPanel');
applySettingsUI(document.documentElement.getAttribute('data-theme')||'light');
if(settingsToggleBtn && settingsPanel){
  settingsToggleBtn.onclick=(e)=>{
    e.stopPropagation();
    const isHidden=settingsPanel.classList.contains('hidden');
    settingsPanel.classList.toggle('hidden');
    settingsToggleBtn.setAttribute('aria-expanded', isHidden?'true':'false');
  };
  const themeBg={light:'#f7f1e8',dark:'#16221e'};
  document.querySelectorAll('.theme-option').forEach(btn=>{
    btn.onclick=(e)=>{
      const theme=btn.dataset.themeChoice;
      const apply=()=>{
        document.documentElement.setAttribute('data-theme', theme);
        try{localStorage.setItem('unimatchTheme', theme);}catch(err){}
        applySettingsUI(theme);
      };
      if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
        apply();
        return;
      }
      const r=e.currentTarget.getBoundingClientRect();
      const x=r.left+r.width/2, y=r.top+r.height/2;
      const radius=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));
      const ripple=document.createElement('div');
      ripple.className='theme-ripple';
      ripple.style.left=(x-radius)+'px';
      ripple.style.top=(y-radius)+'px';
      ripple.style.width=ripple.style.height=(radius*2)+'px';
      ripple.style.background=themeBg[theme]||themeBg.light;
      document.body.appendChild(ripple);
      ripple.getBoundingClientRect();
      ripple.style.transition='transform .5s cubic-bezier(.65,0,.35,1)';
      requestAnimationFrame(()=>{ripple.style.transform='scale(1)';});
      ripple.addEventListener('transitionend',()=>{
        apply();
        ripple.style.transition='opacity .18s ease';
        ripple.style.opacity='0';
        setTimeout(()=>ripple.remove(),220);
      },{once:true});
    };
  });
  document.addEventListener('click',(e)=>{
    if(!settingsPanel.contains(e.target) && e.target!==settingsToggleBtn && !settingsToggleBtn.contains(e.target)){
      settingsPanel.classList.add('hidden');
      settingsToggleBtn.setAttribute('aria-expanded','false');
    }
  });
}
