/* 試作帯：スマホ幅では短い文だけを出し、「くわしく」で全文を開く。
   PC幅（781px以上）では CSS 側で全文を常時表示するため、この開閉は効かない。 */
(function(){
  const band = document.getElementById('trialband');
  const more = document.getElementById('tbMore');
  if(!band || !more) return;
  more.addEventListener('click', ()=>{
    const open = band.classList.toggle('open');
    more.textContent = open ? 'とじる' : 'くわしく';
  });
})();
