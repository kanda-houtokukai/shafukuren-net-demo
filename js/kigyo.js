/* 社福連ネット 企業向けページ（案A道案内・案B一覧）
   ロジックは renkei-mypage-mock-v5.html（凍結モック）から移植。
   データ（SVC・FIELDS・施設一覧）は /data 配下のJSONから読み込む。 */

let SVC = {};
let FIELDS = {};
let GENRES = [];
let ROWS = [];

const ICONS = {
  chat:'<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.4c-.5.4-1.3 0-1.3-.6V6.5z" stroke="CLR" stroke-width="1.7" stroke-linejoin="round"/><circle cx="8.6" cy="10" r="1.1" fill="CLR"/><circle cx="12" cy="10" r="1.1" fill="CLR"/><circle cx="15.4" cy="10" r="1.1" fill="CLR"/>',
  doc:'<rect x="5" y="3.5" width="14" height="17" rx="2.2" stroke="CLR" stroke-width="1.7"/><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4.5" stroke="CLR" stroke-width="1.7" stroke-linecap="round"/>',
  home:'<path d="M4 11.5 12 4.5l8 7" stroke="CLR" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.5 10.5V19.5h11v-9" stroke="CLR" stroke-width="1.7" stroke-linejoin="round"/><path d="M10.5 19.5v-5h3v5" stroke="CLR" stroke-width="1.7" stroke-linejoin="round"/>',
  search:'<circle cx="11" cy="11" r="6.5" stroke="CLR" stroke-width="1.7"/><path d="M16 16l4.5 4.5" stroke="CLR" stroke-width="1.7" stroke-linecap="round"/>'
};
const FCOLOR = {elder:'#5b9bd9', kids:'#f09a4a', adult:'#9d8ac9'};

/* ========== 分野ページの生成 ========== */
function stepsHtml(key, steps){
  const c = FCOLOR[key];
  let h = '<div class="jsteps">';
  steps.forEach((s,i)=>{
    h += '<div class="jstep">';
    if(i===0) h += '<span class="start-chip">START</span>';
    h += '<div class="medal"><span class="nbadge">' + (i+1) + '</span><svg viewBox="0 0 24 24" fill="none">' + ICONS[s.icon].split('CLR').join(c) + '</svg></div>';
    h += '<h3>' + s.t + '</h3><p>' + s.d + '</p>';
    if(s.badge==='free') h += '<span class="free">協定企業の社員は無料</span>';
    if(s.badge==='dur') h += '<span class="dur"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="#7a8681" stroke-width="1.7"/><path d="M12 7.5V12l3 2" stroke="#7a8681" stroke-width="1.7" stroke-linecap="round"/></svg>' + s.durText + '</span>';
    if(s.sub) h += '<div class="subnote">' + s.sub + '</div>';
    h += '</div>';
  });
  return h + '</div>';
}

function buildField(key){
  const F = FIELDS[key];
  let h = '';
  h += '<div class="fieldbanner"><div class="bicon">' + F.icon + '</div>';
  /* 分野名と副題を分けて包む（PCは続けて表示され見た目は同じ／スマホは副題を隠して1行にする） */
  h += '<div class="btxt"><div class="bnow">いま見ているページ</div><h2><span class="bname">' + F.banner + '</span><span class="btitle">：' + F.title + '</span></h2></div>';
  h += '<a class="back" onclick="backToDoors()">← 入口にもどる</a></div>';
  h += '<p class="anon">ここで調べたことが勤務先や施設に伝わることはありません。匿名での相談もできます。</p>';

  h += '<h3 class="secttl">困りごとから探す</h3>';
  h += '<p class="secsub">近いものを選ぶと、合いそうなサービスの候補をご紹介します。</p>';
  h += '<div class="needs">';
  F.needs.forEach((n,i)=>{
    if(n.grp !== undefined){ if(n.grp) h += '<span class="needgrp">' + n.grp + '</span>'; return; }
    h += '<button class="need" onclick="pickNeed(\'' + key + '\',' + i + ',this)">' + n.q + '</button>';
  });
  h += '</div><div class="needout" id="no-' + key + '"></div>';

  h += '<h3 class="secttl">利用までの流れ</h3>';
  if(F.flows.length > 1){
    h += '<div class="flowtabs">';
    F.flows.forEach((fl,i)=>{
      h += '<button class="flowtab' + (i===0?' on':'') + '" onclick="pickFlow(\'' + key + '\',' + i + ',this)">' + fl.label + '</button>';
    });
    h += '</div>';
  }
  h += '<div id="flow-' + key + '">' + stepsHtml(key, F.flows[0].steps) + '</div>';

  h += '<h3 class="secttl">よくある疑問</h3>';
  h += '<p class="secsub">知りたいことの種類を選ぶと、その質問だけが並びます。</p>';
  const gs = genresOf(key);
  h += '<div class="flowtabs faqgenres" id="faqg-' + key + '">';
  gs.forEach((g,i)=>{
    h += '<button class="flowtab' + (i===0?' on':'') + '" onclick="pickGenre(\'' + key + '\',\'' + g.id + '\',this)">' + g.label + '</button>';
  });
  h += '</div>';
  h += '<div class="faq" id="faq-' + key + '"></div>';

  h += '<div class="jgoal"><div class="flag"><svg viewBox="0 0 24 24" fill="none"><path d="M6 21V4" stroke="#8a6a20" stroke-width="2" stroke-linecap="round"/><path d="M6 5h11l-2.5 3.5L17 12H6" stroke="#8a6a20" stroke-width="2" stroke-linejoin="round" fill="#fff"/></svg></div>';
  h += '<div class="msg">受け入れ状況をのぞいてみましょう。<small>空きがあっても利用開始には手続きが必要です。</small></div>';
  h += '<button class="btn" onclick="goList(\'' + key + '\')">空き状況を見る</button></div>';

  const el = document.getElementById('f-' + key);
  el.innerHTML = h;

  /* 最初のジャンルの質問を出しておく */
  if(gs.length) renderFaq(key, gs[0].id);
}

/* ========== よくある疑問（ジャンル → 質問の二段構え） ========== */
function genresOf(key){
  /* その分野に質問があるジャンルだけを、master の並び順で返す */
  const faq = FIELDS[key].faq;
  return GENRES.filter(g=>faq.some(f=>f.genre === g.id));
}
function renderFaq(key, genreId){
  const box = document.getElementById('faq-' + key);
  const list = FIELDS[key].faq.filter(f=>f.genre === genreId);
  let h = '';
  list.forEach(f=>{
    h += '<details><summary><span class="q">Q</span>' + f.q + '<span class="arw">▶</span></summary><div class="a">' + f.a + '</div></details>';
  });
  box.innerHTML = h;
  /* ひとつ開くと他は閉じる（ジャンルを切り替えるたびに結び直す） */
  box.querySelectorAll('details').forEach(d=>{
    d.addEventListener('toggle', ()=>{
      if(d.open){
        box.querySelectorAll('details').forEach(o=>{ if(o!==d) o.open=false; });
      }
    });
  });
}
function pickGenre(key, genreId, btn){
  document.querySelectorAll('#faqg-' + key + ' .flowtab').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  renderFaq(key, genreId);
}

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

/* ========== 案B 施設カードの生成（1枚＝事業所×サービス種別） ========== */
function buildCards(rows){
  const area = document.getElementById('cardArea');
  /* 同一事業所の他サービスを添えるため、事業所ごとにまとめておく */
  const byOffice = {};
  rows.forEach(r=>{ (byOffice[r.officeId] = byOffice[r.officeId] || []).push(r); });

  let h = '';
  rows.forEach(c=>{
    const others = byOffice[c.officeId].filter(o=>o.id !== c.id);
    h += '<div class="card" data-cat="' + c.cat + '" data-svc="' + c.svcCode + '" data-office="' + c.officeId + '">';
    h += '<div class="top">';
    h += '<div><div class="fname">' + c.office + '</div><div class="corp">' + c.corp + '</div></div>';
    h += '<div class="avail ' + c.avail.level + '"><div class="mk">' + c.avail.mark + '</div><div class="tx">' + c.avail.text + '</div></div>';
    h += '</div>';
    h += '<div class="tags"><span class="tag2 ' + c.cat + '">' + c.svcLabel + '</span><span class="tag2 plain">' + c.svcPlain + '</span></div>';
    h += '<div class="meta">' + c.meta + '</div>';
    if(others.length){
      h += '<div class="samesvc">▸ 同じ事業所の他のサービス：' + others.map(o=>o.svcLabel).join('・') + '</div>';
    }
    h += '<div class="foot">';
    const old = isOld(c.updatedAt);
    h += '<span class="updated' + (old ? ' old' : '') + '">' + fmtMD(c.updatedAt) + ' 更新' + (old ? '（情報が古い可能性があります）' : '') + '</span>';
    h += '<div class="links"><a class="hp" href="#">法人HP</a><a class="btn ghost" href="#">' + c.cta + '</a></div>';
    h += '</div>';
    h += '</div>';
  });
  area.innerHTML = h;
}

/* ========== 二段目のフィルタ（サービス種別）を、選んだ分野に合わせて作り直す ========== */
function buildSvcChips(cat, selected){
  const box = document.getElementById('svcChips');
  if(!box) return;
  /* その分野に実在するサービス種別だけを、辞典の並び順で出す */
  const inCat = ROWS.filter(r=>cat==='all' || r.cat===cat);
  const codes = Object.keys(SVC).filter(code=>inCat.some(r=>r.svcCode===code));
  let h = '<button class="chip svcchip' + (selected==='all'?' on':'') + '" data-svc="all">すべてのサービス</button>';
  codes.forEach(code=>{
    const label = (inCat.find(r=>r.svcCode===code) || {}).svcLabel || SVC[code].name;
    h += '<button class="chip svcchip' + (selected===code?' on':'') + '" data-svc="' + code + '">' + label + '</button>';
  });
  box.innerHTML = h;
  box.querySelectorAll('.svcchip').forEach(ch=>{
    ch.addEventListener('click', ()=>{ goList(currentCat, ch.dataset.svc); });
  });
}

function pickFlow(key, idx, btn){
  document.querySelectorAll('#f-' + key + ' .flowtab').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById('flow-' + key).innerHTML = stepsHtml(key, FIELDS[key].flows[idx].steps);
}

function pickNeed(key, idx, btn){
  const F = FIELDS[key];
  document.querySelectorAll('#f-' + key + ' .need').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  const out = document.getElementById('no-' + key);
  const n = F.needs[idx];
  let h = '';
  if(n.s === 'consult'){
    h += '<div class="svcard"><div class="svhead"><span class="svname">迷ったら、そのまま事務局へ</span></div>';
    h += '<p class="svdesc">状況を伺って、合いそうなサービスを一緒に選びます。「何を聞けばいいか分からない」段階のご相談がいちばん多いので、遠慮はいりません。</p>';
    h += '<div class="svfoot"><span class="svnote">電話 0947-00-0000（平日 9:00〜17:00）</span><div class="svbtns"><a class="btn" href="#">相談フォームへ</a></div></div></div>';
  } else {
    n.s.forEach(id=>{
      const s = SVC[id];
      h += '<div class="svcard"><div class="svhead"><span class="svname">' + s.name + '</span><span class="svplain">' + s.plain + '</span></div>';
      h += '<p class="svdesc">' + s.desc + '</p><p class="svex">' + s.ex + '</p>';
      h += '<div class="svfoot"><span class="svnote">候補のご紹介です。ぴったり合うかは事務局が一緒に確認します。</span>';
      h += '<div class="svbtns"><button class="btn ghost" onclick="goList(\'all\',\'' + id + '\')">空きを見る</button><a class="btn" href="#">事務局に相談</a></div></div></div>';
    });
  }
  out.innerHTML = h;
  out.scrollIntoView({behavior:'smooth', block:'nearest'});
}

/* ========== 画面切替 ========== */
function setView(v){
  document.body.dataset.view = v;
  const g=document.getElementById('navGuide'), l=document.getElementById('navList');
  if(g&&l){g.classList.toggle('now', v==='A'); l.classList.toggle('now', v==='B');}
  window.scrollTo({top:0});
}
document.getElementById('navGuide').addEventListener('click', e=>{e.preventDefault(); setView('A');});
document.getElementById('navList').addEventListener('click', e=>{e.preventDefault(); setView('B');});

function openField(key){
  document.querySelectorAll('.fieldpage').forEach(g=>g.classList.remove('show'));
  document.getElementById('f-' + key).classList.add('show');
  /* 入口の選択状態 */
  document.getElementById('doors').classList.add('picked');
  ['elder','kids','adult'].forEach(k=>{
    document.getElementById('door-' + k).classList.toggle('on', k===key);
  });
  document.getElementById('f-' + key).scrollIntoView({behavior:'smooth', block:'start'});
}
function backToDoors(){
  document.getElementById('doors').classList.remove('picked');
  ['elder','kids','adult'].forEach(k=>document.getElementById('door-' + k).classList.remove('on'));
  document.querySelectorAll('.fieldpage').forEach(g=>g.classList.remove('show'));
  window.scrollTo({top:0, behavior:'smooth'});
}

let currentCat = 'all';
let currentSvc = 'all';

function goList(cat, svc){
  cat = cat || 'all';
  svc = svc || 'all';
  /* サービス種別だけを指定して呼ばれたときは、分野は「すべて」に戻す */
  currentCat = cat; currentSvc = svc;
  setView('B');

  /* 一段目：分野チップ */
  document.querySelectorAll('.catchip').forEach(c=>{
    c.classList.toggle('on', c.dataset.f === cat);
  });
  /* 二段目：その分野にあるサービス種別を出し直す */
  buildSvcChips(cat, svc);

  /* 絞り込みの適用 */
  let shown = 0;
  document.querySelectorAll('#cardArea .card').forEach(card=>{
    const hit = (cat==='all' || card.dataset.cat===cat) && (svc==='all' || card.dataset.svc===svc);
    card.style.display = hit ? '' : 'none';
    if(hit) shown++;
  });
  const none = document.getElementById('noresult');
  if(none) none.style.display = shown ? 'none' : 'block';
}

/* 分野チップ：押すとサービス種別は「すべて」に戻す（分野だけで見る経路） */
document.querySelectorAll('.catchip').forEach(ch=>{
  ch.addEventListener('click', ()=>{ goList(ch.dataset.f, 'all'); });
});

/* ========== データ読み込みと初期化 ========== */
(async function init(){
  const [svc, fields, fac, genres] = await Promise.all([
    fetch('data/services.json').then(r=>r.json()),
    fetch('data/fields.json').then(r=>r.json()),
    fetch('data/facilities.json').then(r=>r.json()),
    fetch('data/faq-genres.json').then(r=>r.json())
  ]);
  SVC = svc;
  FIELDS = fields;
  GENRES = genres.genres;
  ROWS = fac.list;
  Object.keys(FIELDS).forEach(buildField);
  buildCards(ROWS);
  buildSvcChips('all', 'all');
  /* houjin.html からの遷移時に案Bを直接開く */
  const v = new URLSearchParams(location.search).get('view');
  if(v === 'B') setView('B');
})();
