(function(){
  if("serviceWorker"in navigator&&location.protocol!=="file:"){addEventListener("load",function(){navigator.serviceWorker.register("./sw.js").catch(function(){})})}
  var ev=null,standalone=matchMedia("(display-mode: standalone)").matches||navigator.standalone;
  if(standalone)return;
  var ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  function bar(txt,btn,fn){
    try{if(localStorage.getItem("orbita-pwa-dismiss"))return}catch(e){}
    var d=document.createElement("div");d.className="pwa-bar";d.setAttribute("role","dialog");
    d.innerHTML='<img src="./logo-mark.png" alt=""><span></span>'+(btn?'<button type="button" class="pwa-go"></button>':'')+'<button type="button" class="pwa-x" aria-label="Yopish">×</button>';
    d.querySelector("span").textContent=txt;if(btn)d.querySelector(".pwa-go").textContent=btn;
    d.querySelector(".pwa-x").onclick=function(){d.remove();try{localStorage.setItem("orbita-pwa-dismiss","1")}catch(e){}};
    if(btn)d.querySelector(".pwa-go").onclick=function(){fn(d)};
    document.body.appendChild(d);
  }
  addEventListener("beforeinstallprompt",function(e){e.preventDefault();ev=e;bar("ORBITA’ni telefoningizga o‘rnating","O‘rnatish",function(d){ev.prompt();ev.userChoice.finally(function(){d.remove()})})});
  if(ios&&matchMedia("(max-width:850px)").matches)setTimeout(function(){bar("Ulashish ▸ “Bosh ekranga qo‘shish” orqali o‘rnating")},2500);
})();
