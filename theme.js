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
