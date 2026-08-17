/* 社福連ネット 法人確認ページ（AI下書きの確認・確定）
   ロジックは確認画面の凍結モックから移植。
   掲載データは data/kakunin/<houjinId>.json（架空のダミー法人）から生成する。
   ※実在法人のデータは法人監修前のため、このリポジトリには含めない。 */

let TOTAL = 0;
const vals = {};

function stepVal(i, d){
  const cur = (vals[i] === undefined) ? 0 : vals[i];
  let n = Math.max(0, cur + d);
  vals[i] = n;
  const el = document.getElementById('v' + i);
  el.textContent = n;
  el.classList.remove('empty');
  const p = document.getElementById('p' + i);
  if(!p) return;
  p.classList.remove('ok','few','none');
  const mk = p.querySelector('.mk');
  if(n === 0){ p.classList.add('none'); mk.textContent = '×'; }
  else if(n <= 1){ p.classList.add('few'); mk.textContent = '△'; }
  else { p.classList.add('ok'); mk.textContent = '◯'; }
}
function confirmCard(i){
  const c = document.getElementById('c' + i);
  const s = document.getElementById('s' + i);
  if(c.classList.contains('done')) return;
  c.classList.add('done');
  s.textContent = '確認済み';
  updateProgress();
  showToast('確定しました');
}
function askFix(i){
  showToast('事務局に修正依頼を送りました');
}
function updateProgress(){
  const n = document.querySelectorAll('.fcard.done').length;
  document.getElementById('doneN').textContent = n;
  document.getElementById('bar').style.width = (n / TOTAL * 100) + '%';
}
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 1600);
}

/* ========== カードの生成 ========== */
function rowHtml(r){
  let h = '<div class="row"><span class="k">' + r.k + '</span>';
  h += '<span class="v' + (r.blank ? ' blank' : '') + '">' + r.v;
  if(r.src){
    /* 出典は {label, url, retrievedAt} 形式（旧: 文字列のみ）。表示は label のみ使う */
    const label = (typeof r.src === 'object') ? r.src.label : r.src;
    h += '<span class="src">' + label + '</span>';
  }
  if(r.chk) h += '<span class="chk">要確認</span>';
  h += '</span></div>';
  return h;
}

function cardHtml(card, n, cat){
  let h = '<div class="fcard" id="c' + n + '" style="--c:var(--' + cat + '); --cs:var(--' + cat + '-soft)">';
  h += '<div class="ftop">';
  h += '<div>';
  h += '<div class="fname">' + card.name + '</div>';
  h += '<div class="fsvc">';
  card.svtags.forEach(t=>{
    if(t.plain){
      h += '<span class="svtag plain">' + t.label + '</span>';
    } else if(t.chk){
      h += '<span class="svtag">' + t.label + '<span class="chk" style="margin-left:4px">要確認</span></span>';
    } else {
      h += '<span class="svtag">' + t.label + '</span>';
    }
  });
  h += '</div>';
  h += '</div>';
  h += '<span class="fstatus" id="s' + n + '">未確認</span>';
  h += '</div>';
  h += '<div class="rows">';
  card.rows.forEach(r=>{ h += rowHtml(r); });
  h += '</div>';
  if(card.slots){
    h += '<div class="slots">';
    h += '<span class="lb">' + card.slots.label + '</span>';
    h += '<div class="stepper">';
    h += '<button class="sbtn" onclick="stepVal(' + n + ',-1)">−</button>';
    h += '<div class="val"><div class="n empty" id="v' + n + '">未入力</div><div class="u">' + card.slots.unit + '</div></div>';
    h += '<button class="sbtn" onclick="stepVal(' + n + ',1)">＋</button>';
    h += '</div>';
    h += '<div class="prev" id="p' + n + '"><div class="mk">—</div><div class="tx">企業側の表示</div></div>';
    h += '</div>';
  }
  h += '<div class="facts">';
  h += '<span class="note">' + card.note + '</span>';
  h += '<div class="btns">';
  h += '<button class="btn warn" onclick="askFix(' + n + ')">修正が必要</button>';
  h += '<button class="btn" onclick="confirmCard(' + n + ')">この内容で確定</button>';
  h += '</div>';
  h += '</div>';
  h += '</div>';
  return h;
}

/* ========== データ読み込みと初期化 ========== */
(async function init(){
  /* 法人ごとに1ファイル: data/kakunin/<houjinId>.json
     表示する法人は ?houjin=<houjinId> で指定（省略時は sample-kai） */
  const param = new URLSearchParams(location.search).get('houjin') || 'sample-kai';
  const houjinId = /^[a-z0-9-]+$/.test(param) ? param : 'sample-kai';
  const D = await fetch('data/kakunin/' + houjinId + '.json').then(r=>r.json());

  /* ログイン中なら法人ページへ戻る導線を出す */
  try{
    if(sessionStorage.getItem('shafukuren.houjin')){
      const back = document.getElementById('backtotop');
      if(back) back.classList.add('show');
    }
  }catch(e){ /* sessionStorage が使えない環境では出さない */ }

  document.title = '社福連ネット｜掲載内容の確認（' + D.houjin.replace(/\s+/g, '') + 'さま）';
  document.getElementById('lbName').textContent = D.houjin + ' さま（登録法人用）';
  document.getElementById('estimate').textContent = D.estimate;

  let n = 0;
  let h = '';
  D.groups.forEach(g=>{
    h += '<section class="grp">';
    h += '<h2><span class="dot" style="background:var(--' + g.cat + ')"></span>' + g.title + '</h2>';
    h += '<p class="gsub">' + g.sub + '</p>';
    g.cards.forEach(card=>{
      n += 1;
      h += cardHtml(card, n, g.cat);
    });
    h += '</section>';
  });
  document.getElementById('groupArea').innerHTML = h;

  TOTAL = n;
  document.getElementById('totalN').textContent = TOTAL;

  let ex = '<h3>' + D.excluded.title + '</h3><ul>';
  D.excluded.items.forEach(item=>{ ex += '<li>' + item.name + '（' + item.reason + '）</li>'; });
  ex += '</ul>';
  ex += '<p style="font-size:12.5px; color:var(--ink-soft); margin-top:8px;">' + D.excluded.note + '</p>';
  document.getElementById('excludedArea').innerHTML = ex;
})();
