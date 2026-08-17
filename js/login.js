/* 社福連ネット 法人ログイン（試作）
   ⚠️ 本物の認証ではない。data/houjin-accounts.json と照合して画面を切り替えるだけの仮の仕組み。
   ログイン状態は sessionStorage に置く（タブを閉じると消える）。
   本番の認証方式は未定・未実装（docs/handoff.md の未決事項を参照）。 */

const SESSION_KEY = 'shafukuren.houjin';
let ACCOUNTS = [];

/* ログイン中の法人を取り出す（他ページからも使う） */
function getLoginedHoujin(){
  try{
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}

function showError(msg){
  const el = document.getElementById('err');
  el.textContent = msg;
  el.classList.add('show');
}
function clearError(){
  document.getElementById('err').classList.remove('show');
}

/* デモ用の入力例を、アカウント一覧から組み立てる（法人を増やせばここも増える） */
function buildDemoList(accounts){
  let h = '';
  accounts.forEach(a=>{
    h += '<div class="row">';
    h += '<span class="nm">' + a.name + '</span>';
    h += '<span class="k">法人ID</span><code>' + a.loginId + '</code>';
    h += '<span class="k">パスワード</span><code>' + a.demoPassword + '</code>';
    h += '</div>';
  });
  document.getElementById('demoList').innerHTML = h;
}

function findAccount(id, pw){
  const key = String(id).trim().toLowerCase();
  return ACCOUNTS.find(a=>
    (a.loginId.toLowerCase() === key || (a.email || '').toLowerCase() === key)
    && a.demoPassword === pw
  );
}

document.getElementById('loginForm').addEventListener('submit', e=>{
  e.preventDefault();
  clearError();
  const id = document.getElementById('loginId').value;
  const pw = document.getElementById('password').value;
  if(!id.trim() || !pw){
    showError('法人IDとパスワードの両方をご入力ください。');
    return;
  }
  const acc = findAccount(id, pw);
  if(!acc){
    showError('法人IDまたはパスワードが違います。下の「デモ用 入力例」をお試しください。');
    return;
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({houjinId: acc.houjinId, name: acc.name}));
  location.href = 'houjin-top.html';
});

/* ========== データ読み込みと初期化 ========== */
(async function init(){
  const d = await fetch('data/houjin-accounts.json').then(r=>r.json());
  ACCOUNTS = d.accounts;
  buildDemoList(ACCOUNTS);
})();
