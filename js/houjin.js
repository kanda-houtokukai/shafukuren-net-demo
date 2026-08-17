/* 社福連ネット 法人向け 空き状況の更新ページ（案C）
   ロジックは renkei-mypage-mock-v5.html（凍結モック）から移植。
   更新対象のサービス行は、ログイン中なら data/koushin/<houjinId>.json、
   未ログインなら data/facilities.json の update 配列（既定のダミー）から生成する。
   ※直接アクセス時にログインを強制しないのはデモの直リンクを優先しているため。
     本番実装時に再検討する（docs/handoff.md の未決事項）。 */

const SESSION_KEY = 'shafukuren.houjin';
function getLoginedHoujin(){
  try{
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}

/* ========== 企業向けページへの遷移 ==========
   開発用の黒いバー（.mocktool）を外したため、いま呼ぶのは
   このページに markup だけ残っている企業向けナビ（非表示）のみ。
   将来そのナビを出す場合にそのまま効くよう残している。 */
function setView(v){
  if(v === 'A'){ window.location.href = 'kigyo.html'; return; }
  if(v === 'B'){ window.location.href = 'kigyo.html?view=B'; return; }
}
const _g = document.getElementById('navGuide'), _l = document.getElementById('navList');
if(_g) _g.addEventListener('click', e=>{e.preventDefault(); setView('A');});
if(_l) _l.addEventListener('click', e=>{e.preventDefault(); setView('B');});

/* ========== 更新日の表示と警告判定（updatedAt から機械判定） ========== */
function fmtMD(iso){
  const p = iso.split('-');
  return parseInt(p[1],10) + '/' + parseInt(p[2],10);
}
function isOld(iso){
  const p = iso.split('-');
  const dt = new Date(parseInt(p[0],10), parseInt(p[1],10)-1, parseInt(p[2],10));
  return (Date.now() - dt.getTime()) > 30*24*60*60*1000; /* 1か月超＝30日超 */
}

/* ========== 更新行の生成 ========== */
function previewClass(n){
  if(n === 0) return {cls:'none', mk:'×'};
  if(n <= 1) return {cls:'few', mk:'△'};
  return {cls:'ok', mk:'◯'};
}

function buildRows(rows){
  const area = document.getElementById('svcArea');
  let h = '';
  rows.forEach((r,i)=>{
    const n = i + 1;
    const pv = previewClass(r.value);
    h += '<section class="svcblock">';
    h += '<h2><span class="cdot" style="background:var(--' + r.cat + ')"></span>' + r.facility + '</h2>';
    h += '<div class="svcrow">';
    h += '<div class="info">';
    h += '<div class="sname">' + r.service + '</div>';
    h += '<div class="stype">' + r.type + '</div>';
    const old = isOld(r.updatedAt);
    h += '<div class="lastup" id="lu' + n + '">最終更新：' + fmtMD(r.updatedAt) + (old ? ' <span style="color:#c0553a">（1か月以上前です）</span>' : '') + '</div>';
    h += '</div>';
    h += '<div class="stepper">';
    h += '<button class="sbtn" onclick="stepVal(\'v' + n + '\',-1)">−</button>';
    h += '<div class="val"><div class="n" id="v' + n + '">' + r.value + '</div><div class="u">' + r.unit + '</div></div>';
    h += '<button class="sbtn" onclick="stepVal(\'v' + n + '\',1)">＋</button>';
    h += '</div>';
    h += '<div class="preview ' + pv.cls + '" id="p' + n + '"><div class="mk">' + pv.mk + '</div><div class="tx">企業側の表示</div></div>';
    h += '<div class="acts">';
    h += '<button class="btn" onclick="doUpdate(\'lu' + n + '\')">この内容で更新</button>';
    h += '<button class="btn ghost" onclick="doUpdate(\'lu' + n + '\')">変化なし</button>';
    h += '</div>';
    h += '</div>';
    h += '</section>';
  });
  area.innerHTML = h;
}

/* ========== 案C ========== */
function stepVal(id, d){
  const el = document.getElementById(id);
  let n = Math.max(0, parseInt(el.textContent,10)+d);
  el.textContent = n;
  const p = document.getElementById('p'+id.slice(1));
  p.classList.remove('ok','few','none');
  const mk = p.querySelector('.mk');
  if(n===0){p.classList.add('none'); mk.textContent='×';}
  else if(n<=1){p.classList.add('few'); mk.textContent='△';}
  else{p.classList.add('ok'); mk.textContent='◯';}
}
function doUpdate(luId){
  const d = new Date();
  document.getElementById(luId).innerHTML = '最終更新：' + (d.getMonth()+1) + '/' + d.getDate() + '（たった今）';
  const t = document.getElementById('toast');
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 1800);
}

/* ========== データ読み込みと初期化 ========== */
(async function init(){
  const h = getLoginedHoujin();
  let rows = null;

  if(h){
    /* ログイン中: その法人の更新行を読む */
    try{
      const d = await fetch('data/koushin/' + encodeURIComponent(h.houjinId) + '.json').then(r=>{
        if(!r.ok) throw new Error('not found');
        return r.json();
      });
      rows = d.rows;
    }catch(e){ rows = null; }   /* 用意がなければ既定のダミーに戻す */

    /* ログインバーの法人名と、法人ページへ戻る導線 */
    const bar = document.querySelector('.loginbar.houjin span');
    if(bar) bar.textContent = h.name + ' さま（登録法人用）';
    const back = document.getElementById('backtotop');
    if(back) back.classList.add('show');
  }

  if(!rows){
    const fac = await fetch('data/facilities.json').then(r=>r.json());
    rows = fac.update;
  }
  buildRows(rows);
})();
