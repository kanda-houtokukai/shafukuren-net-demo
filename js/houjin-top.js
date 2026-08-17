/* 社福連ネット 法人トップ（ログイン後の入口）
   ⚠️ 試作。ログイン状態は sessionStorage に置いているだけで、本物の認証ではない。 */

const SESSION_KEY = 'shafukuren.houjin';

function getLoginedHoujin(){
  try{
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}

(function init(){
  const h = getLoginedHoujin();
  if(!h){
    /* 未ログインならログイン画面へ */
    location.replace('login.html');
    return;
  }
  document.getElementById('who').innerHTML =
    h.name + ' さま<small>としてログイン中</small>';
  /* 確認画面はログイン中の法人のデータを開く */
  document.getElementById('cardKakunin').href = 'kakunin.html?houjin=' + encodeURIComponent(h.houjinId);

  document.getElementById('logout').addEventListener('click', ()=>{
    sessionStorage.removeItem(SESSION_KEY);
    location.href = 'kigyo.html';
  });
})();
