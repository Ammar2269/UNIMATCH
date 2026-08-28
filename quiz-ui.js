/* Quiz UI: renders one question at a time, then the result. */

(function initQuiz(){
  const root = document.getElementById('quiz');
  if(!root) return;

  const intro     = document.getElementById('quizIntro');
  const startBtn  = document.getElementById('quizStart');
  const stage     = document.getElementById('quizStage');
  const progress  = document.getElementById('quizProgress');
  const bar       = document.getElementById('quizBar');
  const counter   = document.getElementById('quizCounter');
  const qText     = document.getElementById('quizQuestion');
  const options   = document.getElementById('quizOptions');
  const backBtn   = document.getElementById('quizBack');
  const result    = document.getElementById('quizResult');

  let answers = [];
  let index = 0;

  function show(el, on){ el.classList.toggle('hidden', !on); }

  function start(){
    answers = []; index = 0;
    show(intro, false); show(result, false); show(stage, true); show(progress, true);
    renderQuestion();
  }

  function renderQuestion(){
    const q = QUIZ_QUESTIONS[index];
    counter.textContent = `Question ${index+1} of ${QUIZ_QUESTIONS.length}`;
    bar.style.width = `${(index / QUIZ_QUESTIONS.length) * 100}%`;
    qText.textContent = q.q;
    options.innerHTML = q.a.map((opt,i)=>`
      <button type="button" class="quiz-option${answers[index]===i?' chosen':''}" data-choice="${i}">
        <span class="quiz-emoji" aria-hidden="true">${opt.e}</span>
        <span class="quiz-option-text">${opt.t}</span>
      </button>`).join('');
    options.querySelectorAll('[data-choice]').forEach(btn=>{
      btn.onclick = ()=>choose(Number(btn.dataset.choice));
    });
    backBtn.classList.toggle('hidden', index === 0);
    qText.focus();
  }

  function choose(choice){
    answers[index] = choice;
    if(index < QUIZ_QUESTIONS.length - 1){
      index++;
      renderQuestion();
    } else {
      finish();
    }
  }

  backBtn.onclick = ()=>{ if(index>0){ index--; renderQuestion(); } };

  /* Windows renders regional-indicator flags as the bare letter pair rather than a
     flag, so the code is drawn as a deliberate archival stamp instead of relying on
     emoji support. */
  function countryCode(flag){
    const cps = [...String(flag || '')].map(c => c.codePointAt(0));
    const letters = cps.filter(c => c >= 0x1F1E6 && c <= 0x1F1FF)
                       .map(c => String.fromCharCode(c - 0x1F1E6 + 65));
    return letters.length === 2 ? letters.join('') : '';
  }

  function finish(){
    const outcome = scoreQuiz(answers);
    const d = outcome.best;
    bar.style.width = '100%';
    show(stage, false); show(progress, false); show(result, true);

    result.innerHTML = `
      <div class="quiz-result-card">
        <span class="label">Your result</span>
        <div class="quiz-stamp" aria-hidden="true"><span>${countryCode(d.flag)}</span></div>
        <h3>${d.country}</h3>
        <p class="quiz-cities">${d.city}</p>
        <p class="quiz-blurb">${d.blurb}</p>
        <div class="quiz-alts">Also close: ${outcome.runnersUp.map(r=>`<span>${r.country}</span>`).join('')}</div>
        <div class="quiz-result-actions">
          <button type="button" class="btn btn-primary" id="quizShowUnis">See universities in ${d.country} <span class="arrow">&#8594;</span></button>
          <button type="button" class="btn btn-ghost" id="quizRetake">Take it again</button>
        </div>
        <div id="quizUnis" class="quiz-unis hidden"></div>
        <p class="quiz-disclaimer">This is a bit of fun, not advice. It ignores tuition, living costs, subject, and entry requirements entirely — for anything you would actually act on, use the <a href="index.html#tool">Match Finder</a>.</p>
      </div>`;

    document.getElementById('quizRetake').onclick = start;
    document.getElementById('quizShowUnis').onclick = ()=>showUniversities(d.country);
    result.scrollIntoView({ behavior:'smooth', block:'center' });
  }

  function showUniversities(country){
    const box = document.getElementById('quizUnis');
    const btn = document.getElementById('quizShowUnis');
    box.classList.remove('hidden');
    box.innerHTML = '<p class="hint">Loading the directory…</p>';
    btn.disabled = true;

    loadDirectory().then(()=>{
      const list = DIRECTORY.filter(([c])=>c===country);
      if(!list.length){
        box.innerHTML = `<p class="hint">No universities are listed for ${country} in the directory yet.</p>`;
        return;
      }
      const shown = list.slice(0, 24);
      box.innerHTML = `
        <div class="quiz-unis-head">
          <span class="label plain">${list.length.toLocaleString()} universities listed in ${country}</span>
        </div>
        <div class="dir-grid quiz-unis-grid">
          ${shown.map(([c,name,url])=>`
            <div class="dir-card">
              <span class="country-tag">${c}</span>
              <h4>${escapeHtml(name)}</h4>
              ${url?`<a href="${escapeAttr(url)}" target="_blank" rel="noopener">Official site &#8599;</a>`:'<span class="hint">No website listed</span>'}
            </div>`).join('')}
        </div>
        ${list.length > shown.length ? `<p class="hint quiz-unis-more">Showing ${shown.length} of ${list.length.toLocaleString()} — open the Directory tab to search all of them.</p>` : ''}`;
    }).catch(()=>{
      box.innerHTML = '<p class="hint">The directory could not be loaded. Check your connection and try again.</p>';
      btn.disabled = false;
    });
  }

  startBtn.onclick = start;
})();
