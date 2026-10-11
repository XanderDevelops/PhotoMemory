// Isolated design preview; never loaded by the authenticated dashboard.
const demoHistory = [510,548,520,590,640,603,710,694,745,723,788,804,772,839,871].map((total,i)=>({
  totalScore:total, completedAtUtc:new Date(Date.now()-(27-i*1.8)*86400000).toISOString(),
  scores:[{category:'Visual Memory',score:Math.round(total*.28)},{category:'Spatial Memory',score:Math.round(total*.14)},
    {category:'Short-Term Memory',score:Math.round(total*.23)},{category:'Associative Memory',score:Math.round(total*.26)},{category:'Working Memory',score:Math.round(total*.09)}]
}));
document.getElementById('admin-name').textContent='Alex Morgan';
document.getElementById('admin-role').textContent='PREVIEW';
document.getElementById('admin-email').textContent='Sample player';
renderPhotoMemoryProgress(demoHistory);
document.getElementById('progress-range').addEventListener('change',()=>renderPhotoMemoryProgress(demoHistory));
document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('.side-nav button').forEach(b=>b.classList.toggle('active',b===button));
  document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.id===button.dataset.tab+'-panel'));
  document.getElementById('page-title').textContent=button.textContent;
  document.body.classList.remove('sidebar-open');
}));
document.getElementById('menu-btn').addEventListener('click',()=>document.body.classList.toggle('sidebar-open'));
document.getElementById('recent-tests-list').innerHTML='<p class="muted">Sample results above show how your synced history will appear.</p>';
document.getElementById('top-highscores-list').innerHTML='<p class="muted">Your existing personal records remain available here.</p>';
document.getElementById('friends-list').innerHTML='<p class="muted">Friends are available after signing in to the real dashboard.</p>';
document.getElementById('history-list').innerHTML=demoHistory.slice().reverse().map(t=>`<div class="compact-item">${new Date(t.completedAtUtc).toLocaleDateString()} <strong>${t.totalScore} / 1,240</strong></div>`).join('');
for(const id of ['refresh-btn','export-report-btn','logout-btn'])document.getElementById(id).disabled=true;
