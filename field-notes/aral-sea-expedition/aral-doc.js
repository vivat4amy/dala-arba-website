/* Aral journal (imported design) — top progress bar + side-rail active day */
(function(){
  'use strict';
  var bar=document.getElementById('am-progress');
  var dots=[].slice.call(document.querySelectorAll('.aral-doc [data-am-dot]'));
  dots.forEach(function(d){ d.style.transition='opacity .3s ease'; });
  var tk=false;
  function upd(){
    var d=document.documentElement, sc=d.scrollTop||window.pageYOffset, max=d.scrollHeight-window.innerHeight;
    if(bar) bar.style.width=(max>0?(sc/max*100):0).toFixed(2)+'%';
    if(dots.length){
      var vh=window.innerHeight, act=0;
      for(var i=0;i<dots.length;i++){
        var sec=document.getElementById('day-'+dots[i].getAttribute('data-am-dot'));
        if(sec && sec.getBoundingClientRect().top<=vh*0.45) act=i;
      }
      for(var j=0;j<dots.length;j++) dots[j].style.opacity = (j===act?'1':'0.4');
    }
    tk=false;
  }
  if(bar||dots.length){
    window.addEventListener('scroll',function(){if(!tk){tk=true;requestAnimationFrame(upd);}},{passive:true});
    window.addEventListener('resize',upd); upd();
  }
})();
