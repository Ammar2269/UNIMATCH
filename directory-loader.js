/* Shared by the main app and the quiz page.

   The directory is ~1.5 MB and most visits never open it, so it is fetched on
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

function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function escapeAttr(s){return escapeHtml(s);}
