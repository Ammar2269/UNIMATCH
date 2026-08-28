const DATA = window.VERIFIED_DATA;
/* The directory is ~1.5 MB and only the Browse tab needs it, so it is fetched on
   demand. Until then DIRECTORY is empty and the headline count comes from
   directory-meta.js, which is a few bytes. */
let DIRECTORY = window.UNIVERSITY_DIRECTORY || []; // [country, name, url][]
const DIRECTORY_TOTAL = window.DIRECTORY_COUNT ?? DIRECTORY.length;
let directoryLoader = null;
function loadDirectory(){
  if(window.UNIVERSITY_DIRECTORY){DIRECTORY=window.UNIVERSITY_DIRECTORY;return Promise.resolve(DIRECTORY);}
  if(directoryLoader)return directoryLoader;
  directoryLoader=new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src='universities-directory.js';
    s.onload=()=>{DIRECTORY=window.UNIVERSITY_DIRECTORY||[];resolve(DIRECTORY);};
    s.onerror=()=>{directoryLoader=null;reject(new Error('Could not load the university directory.'));};
    document.head.appendChild(s);
  });
  return directoryLoader;
}

/* A broad major taxonomy with keyword synonyms, used for BOTH scoring matches and
   deciding which subject chips to show. This list is intentionally much bigger than
   the current database — as verified programs for a major get added to
   verified-data.js, its chip appears automatically. Nothing here needs manual
   updates when new majors are added; just keep this synonym list reasonably
   current so keyword matching stays accurate. Custom typed subjects not in this
   list still work via plain keyword fallback in subjectMatch(). */
const SUBJECT_SYNONYMS = {
  'Artificial Intelligence':['artificial intelligence',' ai ','ai /','ai engineering','machine learning'],
  'Machine Learning':['machine learning','artificial intelligence',' ai ','data science'],
  'Cybersecurity':['cybersecurity','cyber security','information security','network security','technology security'],
  'Computer Science':['computer science','computing'],
  'Computer Engineering':['computer engineering'],
  'Software Engineering':['software engineering'],
  'Software Development':['software development'],
  'Data Science':['data science','big data'],
  'Data Analytics':['data analytics'],
  'Data Engineering':['data engineering'],
  'Information Systems':['information systems'],
  'Information Technology':['information technology'],
  'Business Analytics':['business analytics'],
  'Robotics':['robotics'],
  'Bioinformatics':['bioinformatics'],
  'Business Administration':['business administration','business management','bba','mba','business studies'],
  'Finance':['finance','financial management','banking'],
  'Accounting':['accounting','accountancy'],
  'Marketing':['marketing'],
  'Economics':['economics','economic'],
  'Mechanical Engineering':['mechanical engineering'],
  'Civil Engineering':['civil engineering'],
  'Electrical Engineering':['electrical engineering','electronics engineering'],
  'Chemical Engineering':['chemical engineering'],
  'Medicine':['medicine','medical doctor','md program'],
  'Nursing':['nursing'],
  'Pharmacy':['pharmacy','pharmaceutical'],
  'Dentistry':['dentistry','dental'],
  'Law':['law',' llb',' llm'],
  'Psychology':['psychology'],
  'International Relations':['international relations','political science'],
  'Sociology':['sociology'],
  'Architecture':['architecture'],
  'Fine Arts':['fine arts','visual arts','bfa fine art'],
  'Journalism / Media':['journalism','media studies','communication studies'],
  'Education':['education','teaching degree'],
  'Physics':['physics'],
  'Chemistry':['chemistry'],
  'Biology':['biology','biological sciences'],
  'Mathematics':['mathematics','applied mathematics'],
  'Environmental Science':['environmental science','sustainability'],
  'Agriculture':['agriculture','agricultural science'],
  'Hospitality / Tourism':['hospitality','tourism management'],
  // Art & design majors (added for the Studio Art batch)
  'Painting':['painting'],
  'Drawing':['drawing'],
  'Sculpture':['sculpture'],
  'Ceramics':['ceramics'],
  'Printmaking':['printmaking'],
  'Photography':['photography'],
  'Graphic Design':['graphic design','communication design','visual communication'],
  'Fashion Design':['fashion design','apparel design'],
  'Interior Design':['interior design','interior architecture'],
  'Industrial Design':['industrial design'],
  'Product Design':['product design'],
  'Illustration':['illustration'],
  'Textile Design':['textile design','textiles'],
  'Package Design':['package design','packaging design'],
  'Animation':['animation'],
  'Game Design':['game design','game development'],
  'Interactive Media':['interactive media','interaction design'],
  'Film Production':['film production',' film ','filmmaking'],
  'Television Production':['television production',' tv production'],
  'Video Media Studies':['video media','video production'],
  'Digital Arts':['digital arts','digital media'],
  'Art History':['art history','history of art'],
  'Art Therapy':['art therapy'],
  'Art Education':['art education','art + design education','art and design education'],
  'Arts Management':['arts management','arts administration'],
  'Curatorial Studies':['curatorial studies','curatorial practice']
};

// Broad field groupings, purely for the two-step Field -> Major picker. Add any
// new major from SUBJECT_SYNONYMS to exactly one group here or it won't appear
// in the Major dropdown.
const FIELD_CATEGORIES = {
  'Business & Economics': ['Business Administration','Finance','Accounting','Marketing','Economics','Business Analytics','Hospitality / Tourism'],
  'Computing & Technology': ['Artificial Intelligence','Machine Learning','Cybersecurity','Computer Science','Computer Engineering','Software Engineering','Software Development','Data Science','Data Analytics','Data Engineering','Information Systems','Information Technology','Robotics','Bioinformatics'],
  'Engineering': ['Mechanical Engineering','Civil Engineering','Electrical Engineering','Chemical Engineering'],
  'Health & Medicine': ['Medicine','Nursing','Pharmacy','Dentistry'],
  'Law & Social Sciences': ['Law','Psychology','International Relations','Sociology'],
  'Sciences & Mathematics': ['Physics','Chemistry','Biology','Mathematics','Environmental Science','Agriculture'],
  'Arts & Design': ['Architecture','Fine Arts','Painting','Drawing','Sculpture','Ceramics','Printmaking','Photography','Graphic Design','Fashion Design','Interior Design','Industrial Design','Product Design','Illustration','Textile Design','Package Design','Animation','Game Design','Interactive Media','Film Production','Television Production','Video Media Studies','Digital Arts','Art History','Art Therapy','Art Education','Arts Management','Curatorial Studies'],
  'Media & Communication': ['Journalism / Media'],
  'Education': ['Education'],
};
const FIELD_NAMES = Object.keys(FIELD_CATEGORIES);
const ANY_MAJOR = ''; // sentinel: "all majors within the chosen field"

// How many verified, sourced programs exist right now for a given major key.
// Used to annotate the major dropdown so people can see what's actually covered
// vs. what's still empty — the dropdown lists every major either way.
function countProgramsForMajor(key){
  const syns=SUBJECT_SYNONYMS[key];
  const allPrograms=Object.values(DATA.programs).flat();
  return allPrograms.filter(p=>{
    const hay=text([p.program,p.field].join(' '));
    return syns.some(w=>hay.includes(w.trim()));
  }).length;
}
function countProgramsForField(fieldName){
  const majors=FIELD_CATEGORIES[fieldName]||[];
  const allPrograms=Object.values(DATA.programs).flat();
  return allPrograms.filter(p=>{
    const hay=text([p.program,p.field].join(' '));
    return majors.some(m=>SUBJECT_SYNONYMS[m].some(w=>hay.includes(w.trim())));
  }).length;
}
const ALL_MAJORS=Object.keys(SUBJECT_SYNONYMS).sort((a,b)=>a.localeCompare(b));
const SUBJECTS=ALL_MAJORS.filter(m=>countProgramsForMajor(m)>0); // kept for the coverage summary line
const LEVELS=[{value:'bachelor',label:"Bachelor's"},{value:'master',label:"Master's"},{value:'phd',label:'PhD / Doctorate'}];
const state = {field:FIELD_NAMES[0], subject:ANY_MAJOR, level:'bachelor', profile:null, matches:[]};

/* ---------------- Match Finder (verified data only) ---------------- */

function text(v){return String(v||'').toLowerCase()}
function parseRange(raw){
  const original=String(raw||'');
  const s=original.replace(/,/g,'');
  let values=[];
  const currencyMatches=[...s.matchAll(/([€£$])\s*(\d+(?:\.\d+)?)(?:\s*[–-]\s*(?:[€£$]\s*)?(\d+(?:\.\d+)?))?/g)];
  currencyMatches.forEach(m=>{
    const factor=m[1]==='£'?1.17:m[1]==='$'?.92:1;
    values.push(Number(m[2])*factor);
    if(m[3]) values.push(Number(m[3])*factor);
  });
  if(!values.length && /pln/i.test(s)){
    const pln=[...s.matchAll(/(\d+(?:\.\d+)?)\s*PLN/gi)].map(m=>Number(m[1])/4.3);
    values.push(...pln);
  }
  if(!values.length){
    values=[...s.matchAll(/\b(\d{3,6}(?:\.\d+)?)\b/g)].map(m=>Number(m[1])).filter(n=>n<1900||n>2099);
  }
  if(!values.length)return {min:null,max:null,known:false};
  if(/per\s*semester|\/semester/i.test(original)) values=values.map(v=>v*2);
  return {min:Math.min(...values),max:Math.max(...values),known:true};
}
function inferLevel(p){
  const s=text(p.program+' '+p.notes);
  if(/phd|doctor|doctoral/.test(s))return 'phd';
  if(/master|msc|m\.sc|ma\b/.test(s))return 'master';
  return 'bachelor';
}
function subjectMatch(p,subject,fieldName){
  // Deliberately excludes free-text "notes" from matching: notes often mention
  // unrelated words in passing (e.g. "finance is the issue, not the program"),
  // which causes false-positive subject matches. program + field stay on-topic.
  const hay=text([p.program,p.field].join(' '));
  const q=text(subject).trim();
  if(!q){
    // No specific major chosen: match against ANY major within the selected field.
    const majors=FIELD_CATEGORIES[fieldName]||[];
    if(!majors.length)return 1;
    return majors.some(m=>SUBJECT_SYNONYMS[m].some(w=>hay.includes(text(w).trim())))?1:0;
  }
  const canonicalKey=Object.keys(SUBJECT_SYNONYMS).find(k=>text(k)===q);
  const words=canonicalKey?SUBJECT_SYNONYMS[canonicalKey]:q.split(/\s+/).filter(w=>w.length>2);
  if(!words.length)return 0;
  return words.some(w=>hay.includes(text(w).trim()))?1:0;
}
function examPenalty(p,noExam){
  if(!noExam)return 0;
  const s=text(p.exam);
  if(/written|entrance test|admission test|multiple-choice|math test|tolc|pce/.test(s) && !/no written|no major|no big/.test(s))return 28;
  if(/need confirm|verify|possible/.test(s))return 7;
  return 0;
}
function fieldBadge(score){return score>=82?'good':score>=58?'warn':'bad'}
/* A record counts as verified only if it actually carries source links. Derived at
   runtime rather than stored, so the label can never drift from the data. */
function isSourced(p){return Array.isArray(p.sources)&&p.sources.length>0}
function sourcedCount(){return Object.values(DATA.programs).flat().filter(isSourced).length}
function unsourcedCount(){return Object.values(DATA.programs).flat().filter(p=>!isSourced(p)).length}
function priceStatus(range,budget,strict){
  if(!range.known)return strict?'fail':'uncertain';
  if(range.min<=budget)return range.max<=budget?'fit':'possible';
  if(!strict && range.min<=budget*1.15)return 'stretch';
  return 'fail';
}
function evaluateProgram(p,country,profile){
  const tuition=parseRange(p.tuition), living=parseRange(p.living||country.living);
  const tStatus=priceStatus(tuition,profile.tuition,profile.strict);
  const lStatus=priceStatus(living,profile.living,profile.strict);
  const field=subjectMatch(p,profile.subject,profile.field);
  const level=inferLevel(p)===profile.level;
  const language=profile.language==='Any'||text(p.language).includes(text(profile.language));
  let score=100;
  const reasons=[];
  if(!field){score-=48;reasons.push('Different study field');}else reasons.push('Subject matches');
  if(!level){score-=50;reasons.push(`Database card is ${inferLevel(p)}, not ${profile.level}`);}else reasons.push('Degree level matches');
  if(!language){score-=22;reasons.push('Teaching language does not fully match');}else reasons.push('Language matches');
  if(tStatus==='fit')reasons.push('Tuition fits'); else if(tStatus==='possible'){score-=7;reasons.push('Tuition range partly fits');} else if(tStatus==='stretch'){score-=14;reasons.push('Slightly above tuition budget');} else if(tStatus==='uncertain'){score-=12;reasons.push('Tuition needs confirmation');} else {score-=38;reasons.push('Tuition above budget');}
  if(lStatus==='fit')reasons.push('Living cost fits'); else if(lStatus==='possible'){score-=6;reasons.push('Living range partly fits');} else if(lStatus==='stretch'){score-=12;reasons.push('Living cost slightly above budget');} else if(lStatus==='uncertain'){score-=10;reasons.push('Living cost needs confirmation');} else {score-=30;reasons.push('Living cost above budget');}
  const ep=examPenalty(p,profile.noExam); score-=ep; if(ep>=20)reasons.push('Written exam conflicts with preference'); else if(ep)reasons.push('Exam status needs confirmation'); else if(profile.noExam)reasons.push('No clear written-exam conflict');
  const fit=text(p.fit); if(fit.includes('excellent'))score+=5; if(fit.includes('too expensive')||fit.includes('bad'))score-=8;
  const sourced=isSourced(p);
  if(!sourced){score-=10;reasons.push('Unverified record — no official source link');}
  score=Math.max(0,Math.min(100,Math.round(score)));
  /* Strict mode is a promise about certainty, so it also drops records we cannot
     trace back to an official page. */
  const eligible=field&&level&&language&&sourced&&['fit','possible'].includes(tStatus)&&['fit','possible'].includes(lStatus)&&ep===0;
  const possible=field&&level&&language&&score>=42&&(sourced||!profile.strict);
  return {...p,country:country.name,flag:country.flag,score,reasons,eligible,possible,sourced,tStatus,lStatus,tuitionRange:tuition,livingRange:living,level:inferLevel(p)};
}
function getAllEvaluated(profile){
  const all=[];
  DATA.countries.forEach(c=>(DATA.programs[c.name]||[]).forEach(p=>all.push(evaluateProgram(p,c,profile))));
  return all.sort((a,b)=>b.score-a.score || (a.tuitionRange.min??999999)-(b.tuitionRange.min??999999));
}
function buildCountryMatches(profile){
  const evaluated=getAllEvaluated(profile);
  const map=new Map();
  evaluated.filter(p=>p.possible).forEach(p=>{
    if(!map.has(p.country))map.set(p.country,[]);
    map.get(p.country).push(p);
  });
  return [...map.entries()].map(([name,programs])=>{
    const c=DATA.countries.find(x=>x.name===name);
    const exact=programs.filter(p=>p.eligible).length;
    const avg=Math.round(programs.slice(0,3).reduce((s,p)=>s+p.score,0)/Math.min(3,programs.length));
    return {...c,programs,exact,score:programs[0]?.score||avg};
  }).sort((a,b)=>b.score-a.score || b.exact-a.exact || a.name.localeCompare(b.name));
}
function profileFromForm(){
  return {tuition:Number(document.getElementById('tuition').value),living:Number(document.getElementById('living').value),level:state.level,language:document.getElementById('language').value,subject:state.subject,field:state.field,noExam:document.getElementById('noExam').checked,strict:document.getElementById('strictBudget').checked};
}
function renderLevelChips(){
  const el=document.getElementById('levelChips');
  el.innerHTML=LEVELS.map(l=>`<button type="button" class="chip ${l.value===state.level?'selected':''}" data-level="${l.value}">${l.label}</button>`).join('');
  el.querySelectorAll('.chip').forEach(btn=>btn.onclick=()=>{state.level=btn.dataset.level;renderLevelChips();});
}
function renderFieldSelect(){
  const el=document.getElementById('fieldSelect');
  el.innerHTML=FIELD_NAMES.map(f=>{
    const count=countProgramsForField(f);
    const label=count?`${f} (${count} verified program${count===1?'':'s'})`:`${f} (no verified programs yet)`;
    return `<option value="${f.replace(/"/g,'&quot;')}" ${f===state.field?'selected':''}>${label}</option>`;
  }).join('');
  el.onchange=()=>{state.field=el.value;state.subject=ANY_MAJOR;renderMajorSelect();};
}
function renderMajorSelect(){
  const el=document.getElementById('majorSelect');
  const majorsInField=FIELD_CATEGORIES[state.field]||[];
  const anyCount=countProgramsForField(state.field);
  const anyLabel=anyCount?`All majors in ${state.field} (${anyCount} verified programs)`:`All majors in ${state.field} (no verified programs yet)`;
  const options=[`<option value="" ${state.subject===ANY_MAJOR?'selected':''}>${anyLabel}</option>`];
  majorsInField.forEach(m=>{
    const count=countProgramsForMajor(m);
    const label=count?`${m} (${count} verified program${count===1?'':'s'})`:`${m} (no verified programs yet)`;
    options.push(`<option value="${m.replace(/"/g,'&quot;')}" ${m===state.subject?'selected':''}>${label}</option>`);
  });
  el.innerHTML=options.join('');
  el.onchange=()=>{state.subject=el.value;};
}
function renderCountryResults(){
  const p=state.profile, matches=state.matches;
  document.getElementById('profileForm').classList.add('hidden');
  document.getElementById('universityView').classList.add('hidden');
  document.getElementById('countryResults').classList.remove('hidden');
  document.getElementById('step1').classList.remove('active');document.getElementById('step2').classList.add('active');document.getElementById('step3').classList.remove('active');
  const exact=matches.reduce((s,c)=>s+c.exact,0);
  document.getElementById('resultSummary').textContent=matches.length?`${matches.length} countries contain possible records; ${exact} program${exact===1?'':'s'} meet the strict match rules.`:'No verified database records match every selected requirement yet.';
  document.getElementById('profileSummary').innerHTML=[`€${p.tuition.toLocaleString()}/year tuition`,`€${p.living.toLocaleString()}/month living`,p.subject,p.level[0].toUpperCase()+p.level.slice(1),p.language,p.noExam?'Avoid exams':'Exams allowed',p.strict?'Strict budget':'Flexible budget'].filter(Boolean).map(x=>`<span class="summary-pill">${x}</span>`).join('');
  const grid=document.getElementById('countryGrid');
  if(!matches.length){
    const levelNote=p.level!=='bachelor'?` The verified database currently contains mostly bachelor-level records, so ${p.level} results must be added before this option can return a complete list.`:'';
    grid.innerHTML=`<div class="empty" style="grid-column:1/-1"><b>No verified match found.</b><br>Try a slightly higher budget, allow entrance exams, choose "Any language," or select a field already covered by the database.${levelNote}<br><br>Meanwhile, you can browse the full global directory in the "Browse All Universities" tab and check tuition directly with the schools that interest you.</div>`;return;
  }
  grid.innerHTML=matches.map((c,i)=>`<button class="country-card" data-country="${c.name.replace(/"/g,'&quot;')}"><span class="country-rank">#${i+1} country fit</span><span class="flag">${c.flag}</span><h3>${c.name}</h3><p>${c.region} · ${c.living}</p><div class="matchline"><span class="score">${c.score}% top match</span><span class="count">${c.exact} exact · ${c.programs.length} possible</span></div></button>`).join('');
  grid.querySelectorAll('.country-card').forEach(btn=>btn.onclick=()=>showCountry(btn.dataset.country));
}
function showCountry(name){
  const match=state.matches.find(c=>c.name===name); if(!match)return;
  document.getElementById('countryResults').classList.add('hidden');document.getElementById('universityView').classList.remove('hidden');
  document.getElementById('step2').classList.remove('active');document.getElementById('step3').classList.add('active');
  document.getElementById('countryTitle').textContent=`${match.flag} ${match.name}`;
  document.getElementById('countrySummary').innerHTML=`<b>Typical living estimate:</b> ${match.living}<br>${match.summary}`;
  const list=document.getElementById('universityList');
  list.innerHTML=match.programs.map((p,i)=>{
    const cls=fieldBadge(p.score); const strongest=p.reasons.filter(r=>!r.includes('Different')&&!r.includes('above')&&!r.includes('conflicts')).slice(0,3).join(' · ');
    return `<article class="uni-card"><div class="uni-top"><div><div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:8px"><span class="badge ${cls}">${p.score}% match</span><span class="badge">${p.level}</span>${p.sourced?'<span class="badge good">✓ Source-linked</span>':'<span class="badge warn">Unverified record</span>'}</div><h3>${p.university}</h3><div class="program-name">${p.program}</div></div><div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end"><span class="uni-rank">#${i+1} best fit</span><button type="button" class="wish-btn" data-wish-idx="${i}">♡ Save</button></div></div><div class="reason"><b>Why it ranks here:</b> ${strongest||p.reasons.slice(0,3).join(' · ')}.</div><div class="meta-grid"><div class="meta"><b>City</b><span>${p.city}</span></div><div class="meta"><b>Field</b><span>${p.field}</span></div><div class="meta"><b>Language</b><span>${p.language}</span></div><div class="meta"><b>Tuition</b><span>${p.tuition}</span></div><div class="meta"><b>Living cost</b><span>${p.living}</span></div><div class="meta"><b>Deadline</b><span>${p.deadline}</span></div><div class="meta"><b>Admission / exam</b><span>${p.exam}</span></div><div class="meta"><b>Original fit note</b><span>${p.fit}</span></div></div><div class="notes">${p.notes}</div>${p.sourced?`<div class="links">${p.sources.map(s=>`<a href="${s[1]}" target="_blank" rel="noopener">${s[0]} ↗</a>`).join('')}</div>`:'<div class="unverified-note"><b>No official source on file.</b> These figures came from a bulk dataset and have not been checked against the university\'s own pages. Treat them as a lead to investigate, not as confirmed prices — verify everything on the official site before acting on it.</div>'}</article>`;
  }).join('');
  list.querySelectorAll('[data-wish-idx]').forEach(btn=>{
    const p=match.programs[Number(btn.dataset.wishIdx)];
    const item={type:'program',country:match.name,flag:match.flag,university:p.university,program:p.program,field:p.field,city:p.city,tuition:p.tuition,language:p.language,level:p.level,sources:p.sources||[]};
    setWishBtnState(btn,isProgramSaved(item));
    btn.onclick=()=>{const saved=toggleProgramWishlist(item);setWishBtnState(btn,saved);renderWishlistTab();};
  });
  document.getElementById('universityView').scrollIntoView({behavior:'smooth',block:'start'});
}
function renderChecklist(){
  const saved=JSON.parse(localStorage.getItem('unimatchChecklist')||'{}');
  const grid=document.getElementById('checkGrid');
  grid.innerHTML=DATA.checklist.map((g,gi)=>`<div class="check-group"><h3>${g.section}</h3>${g.items.map((item,ii)=>{const id=`${gi}-${ii}`,checked=!!saved[id];return `<label class="checkitem ${checked?'done':''}"><input type="checkbox" data-id="${id}" ${checked?'checked':''}><span>${item}</span></label>`}).join('')}</div>`).join('');
  grid.querySelectorAll('input').forEach(box=>box.onchange=()=>{const s=JSON.parse(localStorage.getItem('unimatchChecklist')||'{}');s[box.dataset.id]=box.checked;localStorage.setItem('unimatchChecklist',JSON.stringify(s));box.closest('.checkitem').classList.toggle('done',box.checked);updateProgress();});updateProgress();
}
function updateProgress(){const boxes=[...document.querySelectorAll('#checkGrid input')],done=boxes.filter(x=>x.checked).length,pct=boxes.length?Math.round(done/boxes.length*100):0;document.getElementById('progressFill').style.width=pct+'%';document.getElementById('progressText').textContent=`${pct}% complete (${done}/${boxes.length})`;}
function resetForm(){document.getElementById('profileForm').reset();document.getElementById('tuition').value=4500;document.getElementById('living').value=900;document.getElementById('noExam').checked=true;state.field=FIELD_NAMES[0];state.subject=ANY_MAJOR;state.level='bachelor';renderFieldSelect();renderLevelChips();renderMajorSelect();}

document.getElementById('profileForm').addEventListener('submit',e=>{e.preventDefault();state.profile=profileFromForm();state.matches=buildCountryMatches(state.profile);localStorage.setItem('unimatchProfile',JSON.stringify(state.profile));renderCountryResults();});
document.getElementById('editProfile').onclick=()=>{document.getElementById('countryResults').classList.add('hidden');document.getElementById('profileForm').classList.remove('hidden');document.getElementById('step1').classList.add('active');document.getElementById('step2').classList.remove('active');};
document.getElementById('backCountries').onclick=renderCountryResults;
document.getElementById('resetProfile').onclick=resetForm;
document.getElementById('countryStat').textContent=DATA.countries.length.toLocaleString();
document.getElementById('programStat').textContent=sourcedCount().toLocaleString();
(function(){const el=document.getElementById('unverifiedStat');if(el)el.textContent=unsourcedCount().toLocaleString();})();
document.getElementById('directoryStat').textContent=DIRECTORY_TOTAL.toLocaleString();
renderFieldSelect();renderLevelChips();renderMajorSelect();renderChecklist();renderCoverageSummary();

function renderCoverageSummary(){
  const allPrograms=Object.values(DATA.programs).flat();
  const levels=[...new Set(allPrograms.map(inferLevel))];
  const countriesWithPrograms=DATA.countries.filter(c=>(DATA.programs[c.name]||[]).length);
  const levelLabel=levels.map(l=>l==='phd'?'PhD':l[0].toUpperCase()+l.slice(1)).join(' / ');
  const subjectText=SUBJECTS.length?SUBJECTS.join(', '):'no majors yet';
  const summary=`Currently verified: <b>${subjectText}</b> (${allPrograms.length} program${allPrograms.length===1?'':'s'}, ${levelLabel||'no'} level${levels.length===1?'':'s'}) across ${countriesWithPrograms.length} countr${countriesWithPrograms.length===1?'y':'ies'}.`;
  const calloutEl=document.getElementById('coverageText');
  if(calloutEl)calloutEl.innerHTML=summary;
  const hintEl=document.getElementById('subjectHint');
  if(hintEl)hintEl.textContent=SUBJECTS.length?`Verified programs currently exist for: ${SUBJECTS.join(', ')}. Other majors are listed too — they'll return real matches as soon as verified data for them is added.`:'No majors are verified yet — pick one anyway, matches will appear once verified data is added.';
}

/* ---------------- Tab switching ---------------- */

const tabBtnFinder=document.getElementById('tabBtnFinder'), tabBtnDirectory=document.getElementById('tabBtnDirectory'), tabBtnWishlist=document.getElementById('tabBtnWishlist');
const tabFinder=document.getElementById('tabFinder'), tabDirectory=document.getElementById('tabDirectory'), tabWishlist=document.getElementById('tabWishlist');
function activateTab(btn,panel){
  [tabBtnFinder,tabBtnDirectory,tabBtnWishlist].forEach(b=>b&&b.classList.remove('active'));
  [tabFinder,tabDirectory,tabWishlist].forEach(p=>p&&p.classList.remove('active'));
  btn.classList.add('active'); panel.classList.add('active');
}
tabBtnFinder.onclick=()=>activateTab(tabBtnFinder,tabFinder);
tabBtnDirectory.onclick=()=>{activateTab(tabBtnDirectory,tabDirectory);initDirectoryOnce();};
if(tabBtnWishlist&&tabWishlist)tabBtnWishlist.onclick=()=>{activateTab(tabBtnWishlist,tabWishlist);renderWishlistTab();};

/* ---------------- Browse directory (raw CSV data, unscored) ---------------- */

const dirState={query:'',country:'',page:0,pageSize:24,filtered:null};
let dirInitialized=false;

function initDirectoryOnce(){
  if(dirInitialized)return; dirInitialized=true;
  const meta=document.getElementById('dirMeta');
  if(meta && !window.UNIVERSITY_DIRECTORY)meta.textContent=`Loading ${DIRECTORY_TOTAL.toLocaleString()} universities…`;
  loadDirectory().then(buildDirectoryUI).catch(err=>{
    dirInitialized=false;
    if(meta)meta.textContent='The directory could not be loaded. Check your connection and open this tab again.';
    console.error(err);
  });
}
function buildDirectoryUI(){
  const countryCounts=new Map();
  DIRECTORY.forEach(([country])=>countryCounts.set(country,(countryCounts.get(country)||0)+1));
  const countries=[...countryCounts.keys()].sort((a,b)=>a.localeCompare(b));
  const sel=document.getElementById('dirCountry');
  sel.innerHTML='<option value="">All countries</option>'+countries.map(c=>`<option value="${c.replace(/"/g,'&quot;')}">${c} (${countryCounts.get(c)})</option>`).join('');
  sel.onchange=()=>{dirState.country=sel.value;dirState.page=0;applyDirectoryFilter();};

  const search=document.getElementById('dirSearch');
  let t=null;
  search.oninput=()=>{clearTimeout(t);t=setTimeout(()=>{dirState.query=search.value.trim().toLowerCase();dirState.page=0;applyDirectoryFilter();},180);};

  document.getElementById('dirPrev').onclick=()=>{if(dirState.page>0){dirState.page--;renderDirectoryPage();}};
  document.getElementById('dirNext').onclick=()=>{const max=Math.max(0,Math.ceil((dirState.filtered?.length||0)/dirState.pageSize)-1);if(dirState.page<max){dirState.page++;renderDirectoryPage();}};

  applyDirectoryFilter();
}
function applyDirectoryFilter(){
  const q=dirState.query, ctry=dirState.country;
  dirState.filtered=DIRECTORY.filter(([country,name])=>{
    if(ctry && country!==ctry)return false;
    if(q && !name.toLowerCase().includes(q))return false;
    return true;
  });
  renderDirectoryPage();
}
function renderDirectoryPage(){
  const {filtered,page,pageSize}=dirState;
  const total=filtered.length;
  const pages=Math.max(1,Math.ceil(total/pageSize));
  const clampedPage=Math.min(page,pages-1);
  dirState.page=clampedPage;
  const start=clampedPage*pageSize;
  const slice=filtered.slice(start,start+pageSize);
  document.getElementById('dirMeta').textContent=total?`Showing ${start+1}–${Math.min(start+pageSize,total)} of ${total.toLocaleString()} universities`:'No universities match that search.';
  const grid=document.getElementById('dirGrid');
  grid.innerHTML=slice.map(([country,name,url],i)=>`<div class="dir-card"><span class="country-tag">${country}</span><h4>${escapeHtml(name)}</h4><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:4px">${url?`<a href="${escapeAttr(url)}" target="_blank" rel="noopener">Official site ↗</a>`:'<span class="hint">No website listed</span>'}<button type="button" class="wish-btn" data-dir-wish-idx="${i}">♡</button></div></div>`).join('');
  grid.querySelectorAll('[data-dir-wish-idx]').forEach(btn=>{
    const [country,name,url]=slice[Number(btn.dataset.dirWishIdx)];
    const item={type:'university',country,name,url};
    setWishBtnState(btn,isUniSaved(item));
    btn.onclick=()=>{const saved=toggleUniWishlist(item);setWishBtnState(btn,saved);renderWishlistTab();};
  });
  document.getElementById('dirPageLabel').textContent=`Page ${clampedPage+1} of ${pages}`;
  document.getElementById('dirPrev').disabled=clampedPage<=0;
  document.getElementById('dirNext').disabled=clampedPage>=pages-1;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function escapeAttr(s){return escapeHtml(s);}

/* ---------------- Wishlist (saved programs & universities, localStorage only) ---------------- */

function getWishlist(){
  try{ const w=JSON.parse(localStorage.getItem('unimatchWishlist')||'{}'); return {programs:w.programs||[], universities:w.universities||[]}; }
  catch(e){ return {programs:[],universities:[]}; }
}
function saveWishlistData(w){ try{ localStorage.setItem('unimatchWishlist', JSON.stringify(w)); }catch(e){} }
function programKey(p){ return `${p.country}||${p.university}||${p.program}`; }
function uniKey(u){ return `${u.country}||${u.name}`; }
function isProgramSaved(p){ return getWishlist().programs.some(x=>programKey(x)===programKey(p)); }
function isUniSaved(u){ return getWishlist().universities.some(x=>uniKey(x)===uniKey(u)); }
function toggleProgramWishlist(p){
  const w=getWishlist(); const key=programKey(p);
  const idx=w.programs.findIndex(x=>programKey(x)===key);
  if(idx>=0)w.programs.splice(idx,1); else w.programs.push(p);
  saveWishlistData(w); updateWishlistCount();
  return idx<0;
}
function toggleUniWishlist(u){
  const w=getWishlist(); const key=uniKey(u);
  const idx=w.universities.findIndex(x=>uniKey(x)===key);
  if(idx>=0)w.universities.splice(idx,1); else w.universities.push(u);
  saveWishlistData(w); updateWishlistCount();
  return idx<0;
}
function setWishBtnState(btn,saved){
  btn.classList.toggle('saved',saved);
  btn.textContent = btn.hasAttribute('data-wish-idx') ? (saved?'♥ Saved':'♡ Save') : (saved?'♥':'♡');
}
function updateWishlistCount(){
  const w=getWishlist(); const total=w.programs.length+w.universities.length;
  const badge=document.getElementById('wishlistCount');
  if(badge) badge.textContent = total? ` (${total})` : '';
}
function renderWishlistTab(){
  const w=getWishlist();
  const progEl=document.getElementById('wishlistPrograms'), uniEl=document.getElementById('wishlistUniversities'), emptyEl=document.getElementById('wishlistEmpty');
  if(!progEl||!uniEl||!emptyEl)return;
  emptyEl.classList.toggle('hidden', w.programs.length>0 || w.universities.length>0);
  progEl.innerHTML=w.programs.map((p,i)=>`<article class="uni-card"><div class="uni-top"><div><span class="badge">${p.level||''}</span><h3 style="margin-top:8px">${p.university}</h3><div class="program-name">${p.program}</div></div><button type="button" class="wish-btn saved" data-remove-program="${i}">♥ Remove</button></div><div class="meta-grid"><div class="meta"><b>Country</b><span>${p.flag||''} ${p.country}</span></div><div class="meta"><b>City</b><span>${p.city||'—'}</span></div><div class="meta"><b>Field</b><span>${p.field||'—'}</span></div><div class="meta"><b>Language</b><span>${p.language||'—'}</span></div><div class="meta"><b>Tuition</b><span>${p.tuition||'—'}</span></div></div>${(p.sources&&p.sources.length)?`<div class="links">${p.sources.map(s=>`<a href="${s[1]}" target="_blank" rel="noopener">${s[0]} ↗</a>`).join('')}</div>`:''}</article>`).join('');
  uniEl.innerHTML=w.universities.map((u,i)=>`<div class="dir-card"><span class="country-tag">${u.country}</span><h4>${escapeHtml(u.name)}</h4><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:4px">${u.url?`<a href="${escapeAttr(u.url)}" target="_blank" rel="noopener">Official site ↗</a>`:'<span class="hint">No website listed</span>'}<button type="button" class="wish-btn saved" data-remove-uni="${i}">♥</button></div></div>`).join('');
  progEl.querySelectorAll('[data-remove-program]').forEach(btn=>btn.onclick=()=>{const cur=getWishlist();cur.programs.splice(Number(btn.dataset.removeProgram),1);saveWishlistData(cur);updateWishlistCount();renderWishlistTab();});
  uniEl.querySelectorAll('[data-remove-uni]').forEach(btn=>btn.onclick=()=>{const cur=getWishlist();cur.universities.splice(Number(btn.dataset.removeUni),1);saveWishlistData(cur);updateWishlistCount();renderWishlistTab();});
}
updateWishlistCount();

/* ---------------- Top announcement banner ---------------- */

(function initTopBanner(){
  const banner=document.getElementById('topBanner');
  if(!banner)return;
  if(localStorage.getItem('unimatchBannerDismissed')==='1'){ banner.classList.add('hidden'); return; }
  const totalCountries=DATA.countries.filter(c=>(DATA.programs[c.name]||[]).length).length;
  const textEl=document.getElementById('topBannerText');
  if(textEl)textEl.innerHTML=`✦ <b>${sourcedCount().toLocaleString()}</b> source-linked programmes across <b>${totalCountries}</b> countries, plus <b>${unsourcedCount().toLocaleString()}</b> unverified records clearly marked as such. Browse ${DIRECTORY_TOTAL.toLocaleString()} universities in the directory.`;
  const closeBtn=document.getElementById('topBannerClose');
  if(closeBtn)closeBtn.onclick=()=>{banner.classList.add('hidden'); try{localStorage.setItem('unimatchBannerDismissed','1');}catch(e){}};
})();

/* ---------------- Back-to-top button ---------------- */

(function initBackToTop(){
  const btn=document.getElementById('backToTop');
  if(!btn)return;
  window.addEventListener('scroll',()=>{
    btn.classList.toggle('hidden', window.scrollY<420);
  });
  btn.onclick=()=>window.scrollTo({top:0,behavior:'smooth'});
})();
