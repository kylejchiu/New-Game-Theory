const initTheme = (() => {
  const toggle = (btn) => {
    if (!btn) return;
    const apply = () => {
      const isDark = localStorage.getItem('darkMode') === 'true';
      document.body.classList.toggle('dark', isDark);
      btn.textContent = isDark ? 'Light Mode' : 'Dark Mode';
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    };
    apply();
    btn.addEventListener('click', () => {
      const isNow = !document.body.classList.contains('dark');
      document.body.classList.toggle('dark', isNow);
      localStorage.setItem('darkMode', isNow ? 'true' : 'false');
      btn.textContent = isNow ? 'Light Mode' : 'Dark Mode';
      btn.setAttribute('aria-pressed', isNow ? 'true' : 'false');
    });
  };
  return () => toggle(document.getElementById('theme-toggle'));
})();

document.addEventListener('DOMContentLoaded', () => {
  initTheme();

  const quizContainer = document.getElementById('quiz-container');
  if (quizContainer) {
    const questions = window.questionsData || [];
    questions.forEach((q, index) => {
      const div = document.createElement('div');
      div.className = 'quiz-question';
      div.innerHTML = `
        <h3>${index + 1}. ${q.question}</h3>
        <ul class="options">
          ${q.options.map((opt,i)=>`<li><button data-index="${i}">${opt}</button></li>`).join('')}
        </ul>
        <div class="explanation"></div>
      `;
      quizContainer.appendChild(div);
    });

    document.querySelectorAll('.quiz-question').forEach((qEl, qIndex) => {
      qEl.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          const selected = parseInt(btn.dataset.index);
          const explanationDiv = qEl.querySelector('.explanation');
          explanationDiv.style.display = 'block';
          explanationDiv.textContent = questions[qIndex].explanation;

          qEl.querySelectorAll('button').forEach(b=>{ b.classList.remove('correct','incorrect'); });
          if (questions[qIndex].answer.includes(selected)) btn.classList.add('correct');
          else btn.classList.add('incorrect');
        });
      });
    });
  }

  const chatEl = document.getElementById('chat');
  if (chatEl) {
    const BACKEND_URL = document.body.dataset.backend || '/chat';
    const inputEl = document.getElementById('msg');
    const sendBtn = document.getElementById('sendBtn');
    let messages = [];

    function sanitize(text) {
      return text.replace(/\[\/?INST\]/gi, "").replace(/<\/s>/gi, "").replace(/\/inst/gi, "");
    }
    function addMessage(role, text) {
      const div = document.createElement('div');
      div.className = role;
      const cleaned = sanitize(text);
      const formatted = cleaned.split(/\n{2,}/).map(p=>`<p>${p.trim()}</p>`).join('');
      const label = role === 'user' ? 'You: ' : role === 'assistant' ? 'AI Ethics Chatbot: ' : '';
      div.innerHTML = `<strong>${label}</strong>${formatted}`;
      chatEl.appendChild(div);
      chatEl.scrollTop = chatEl.scrollHeight;
    }

    async function sendMessage() {
      const text = inputEl.value.trim(); if (!text) return;
      inputEl.value = '';
      addMessage('user', text);
      messages.push({ role: 'user', content: text });
      addMessage('system', 'Thinking...');
      sendBtn.disabled = true;
      try {
        const res = await fetch(BACKEND_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ messages }) });
        const data = await res.json();
        document.querySelector('.system:last-child')?.remove();
        const reply = data?.reply || data?.choices?.[0]?.message?.content || data?.error || '[No response]';
        addMessage('assistant', reply);
        messages.push({ role: 'assistant', content: reply });
      } catch (err) {
        document.querySelector('.system:last-child')?.remove();
        addMessage('system', '⚠️ Error: ' + (err.message || err));
      } finally { sendBtn.disabled = false; inputEl.focus(); }
    }

    sendBtn.addEventListener('click', sendMessage);
    inputEl.addEventListener('keydown', e=>{ if (e.key === 'Enter') sendMessage(); });
    addMessage('assistant', 'Hi! I’m your AI Ethics Tutor — ask me about fairness, privacy, or responsible AI!');
  }

  const wheelCanvas = document.getElementById('wheelCanvas');
  const factOfDayEl = document.getElementById('fact-of-day');
  if (factOfDayEl) {
    const facts = window.__FACTS_ARRAY__ || [];
    const dayFact = facts.length ? facts[new Date().getDate() % facts.length] : 'Explore our case studies for more.';
    factOfDayEl.textContent = 'Fact of the Day: ' + dayFact;
  }
  if (wheelCanvas) {
    const facts = window.__FACTS_ARRAY__ || [];
    const ctx = wheelCanvas.getContext('2d');
    const numSegments = Math.max(1, facts.length);
    const angle = (2 * Math.PI) / numSegments;
    const colors = ['#00bfa6','#009e8a'];
    let startAngle = 0;
    for (let i=0;i<numSegments;i++){
      const endAngle = startAngle + angle;
      ctx.beginPath(); ctx.moveTo(wheelCanvas.width/2, wheelCanvas.height/2);
      ctx.arc(wheelCanvas.width/2, wheelCanvas.height/2, Math.min(wheelCanvas.width, wheelCanvas.height)/2 - 10, startAngle, endAngle);
      ctx.fillStyle = colors[i%2]; ctx.fill(); startAngle = endAngle;
    }
    const spinBtn = document.getElementById('wheel-center');
    const selectedFact = document.getElementById('selected-fact');
    let currentRotation = 0; const wheel = wheelCanvas;
    if (spinBtn){ spinBtn.onclick = ()=>{
      const spins = Math.floor(Math.random()*360);
      currentRotation += 1080 + spins;
      wheel.style.transform = `rotate(${currentRotation}deg)`;
      const index = Math.floor((numSegments - ((currentRotation / (360 / numSegments)) % numSegments)) % numSegments);
      setTimeout(()=>{ selectedFact && (selectedFact.textContent = 'Fact: ' + (facts[index]||'')); }, 3000);
    }}
  }

  const trainBtn = document.getElementById('train');
  if (trainBtn) {
    ['exp','edu','bias'].forEach(id=>{
      const el=document.getElementById(id); const val=document.getElementById(id+'-val'); if(!el||!val) return; el.oninput=()=>val.textContent=el.value;
    });
    let decision='accept';
    const acc=document.getElementById('accept'); const rej=document.getElementById('reject');
    if (acc && rej) {
      acc.onclick=()=>{ decision='accept'; acc.classList.add('active'); rej.classList.remove('active'); };
      rej.onclick=()=>{ decision='reject'; rej.classList.add('active'); acc.classList.remove('active'); };
    }
    let dataset={accept:0,reject:0,expSum:0,eduSum:0,biasSum:0,total:0};
    const ctxEl = document.getElementById('datasetChart');
    let chart = null;
    if (ctxEl && window.Chart) {
      const ctx2 = ctxEl.getContext('2d');
      chart = new Chart(ctx2,{ type:'bar', data:{ labels:['Accepted','Rejected','Avg Experience','Avg Education','Avg Bias'], datasets:[{ label:'Dataset Stats', data:[0,0,0,0,0], backgroundColor:['#00bfa6','#ff5f5f','#5ad7c1','#42c7b2','#2eb09f'] }] }, options:{scales:{y:{beginAtZero:true}}, plugins:{legend:{display:false}}} });
    }
    trainBtn.onclick=()=>{
      const n=parseInt(document.getElementById('count').value)||0; if(n<=0) return; const exp=parseInt(document.getElementById('exp').value); const edu=parseInt(document.getElementById('edu').value); const bias=parseInt(document.getElementById('bias').value);
      if(decision==='accept')dataset.accept+=n; else dataset.reject+=n; dataset.expSum+=exp*n; dataset.eduSum+=edu*n; dataset.biasSum+=bias*n; dataset.total+=n;
      const avgExp=dataset.expSum/dataset.total, avgEdu=dataset.eduSum/dataset.total, avgBias=dataset.biasSum/dataset.total;
      if(chart){ chart.data.datasets[0].data=[dataset.accept,dataset.reject,avgExp,avgEdu,avgBias]; chart.update(); }
    };
    const predictBtn = document.getElementById('predict');
    if (predictBtn) {
      predictBtn.onclick=()=>{
        const exp=parseInt(document.getElementById('test-exp').value); const edu=parseInt(document.getElementById('test-edu').value); const avgBias=dataset.total>0?(dataset.biasSum/dataset.total):50; const score=(exp*0.4 + edu*0.4 - avgBias*0.2); const pred=document.getElementById('prediction'); pred.textContent= score>50? 'AI would ACCEPT this applicant.':'AI would REJECT this applicant.'; pred.style.color= score>50? 'var(--teal)':'#ff5f5f';
      };
    }
  }

});