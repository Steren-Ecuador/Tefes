/* TEFES · Avisos › Mi área (call center): proformas del POS para dar seguimiento (pf4, 2026-11-11).
   Datos en vivo desde la app (apiPFCC con la clave de área); nada de clientes queda en este repositorio. */
(function(){
const CSS='.pfc{background:#ffffff12;border-radius:14px;padding:12px;margin-bottom:8px;cursor:pointer}.pfc b{font-size:16px;font-weight:800}'+
 '.pfc .l1{display:flex;justify-content:space-between;gap:8px;align-items:center}.pfc small{display:block;color:var(--muted);font-size:12.5px;margin-top:3px}'+
 '.pfo{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.pfo button{flex:1 1 auto;border:0;border-radius:10px;background:#ffffff1c;color:#fff;font-weight:700;font-size:14px;padding:9px 10px;cursor:pointer}'+
 '.pfo button.on{background:var(--accent);color:#111}.pfi{width:100%;border:0;border-radius:10px;background:#ffffff1c;color:#fff;font-size:15px;padding:10px;margin-top:6px}'+
 '.pfh{border-left:3px solid var(--accent);padding:2px 0 2px 10px;margin:8px 0;font-size:14px}.pfh small{display:block;color:var(--muted)}'+
 '.pff{text-align:center;padding:30px 10px}.pff .e{font-size:70px}.pff b{display:block;font-size:28px;font-weight:900;margin:6px 0}';
const CAN=[['💬','WhatsApp'],['📞','Llamada'],['✉️','Correo']];
const RES=[['😍','¡Le interesa!'],['🤔','Lo está pensando'],['🏃','Va a ir a la tienda'],['💲','Pide otro precio'],['📵','No contestó']];
const MOT={'Le pareció caro':'💲','No teníamos stock':'📦','Compró en otro lado':'🏬','No responde':'📵','Ya no lo necesita':'🤷','Otro':'✏️'};
const ANIMO=['¡Anotado! Un paso más cerca de la venta 💪','¡Eso! Con seguimiento se vende más 🙌','¡Bien! Tu cliente sabe que lo tienes presente 😊'];
let CL='',APP='',D=null;
const money=n=>'$'+(Math.round(n*100)/100).toLocaleString('es-EC',{minimumFractionDigits:2,maximumFractionDigits:2});
const dias=(a,b)=>Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/864e5);
const sum=(f,n)=>{const d=new Date(f+'T12:00:00');d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
const corto=n=>{const p=String(n||'').trim().split(/\s+/);const w=p[0]||'';return w.charAt(0).toUpperCase()+w.slice(1).toLowerCase()};
const tel=p=>String(p.cel||'').replace(/\D/g,'');
const wa=p=>{let t=tel(p);if(t.startsWith('0'))t='593'+t.slice(1);return 'https://wa.me/'+t+'?text='+encodeURIComponent('¡Hola '+corto(p.cliente)+'! 👋 Soy '+corto(D.persona)+', de Steren. Te escribo por la cotización'+(p.productos&&!/^Proforma /.test(p.productos)?' de '+p.productos:'')+'. ¿Te ayudo a cerrarla? 😊')};
function api(fn,...a){return fetch(APP,{method:'POST',body:JSON.stringify({fn:fn,args:a}),headers:{'Content-Type':'text/plain;charset=utf-8'}}).then(r=>r.json()).then(j=>{if(!j||!j.ok)throw new Error((j&&j.error)||'Error del servidor.');return j.r})}
function toast(m){const t=document.createElement('div');t.textContent=m;t.style.cssText='position:absolute;left:50%;bottom:40px;transform:translateX(-50%);z-index:60;background:#fff;color:#111;font-weight:700;padding:10px 16px;border-radius:12px;max-width:90%;text-align:center';document.querySelector('.app').appendChild(t);setTimeout(()=>t.remove(),2600)}
function estado(p){if(p.estado==='Compró')return['🎉 Compró','g'];if(p.estado==='No compró')return['No compró','r'];
 if(p.fuera)return['¿Compró?','y'];if(!p.hist.length){const d=dias(p.creada,D.hoy);return d>=2?['Esperando '+d+' días','r']:['Nueva','y']}
 return p.contacto&&p.contacto<=D.hoy?['Hoy toca','y']:['En seguimiento','g']}
function lista(){const ab=D.filas.filter(p=>p.estado==='Abierta'),ce=D.filas.filter(p=>p.estado!=='Abierta');
 const urg=ab.filter(p=>!p.hist.length||p.fuera||(p.contacto&&p.contacto<=D.hoy));
 ab.sort((a,b)=>(urg.includes(b)-urg.includes(a))||(a.creada<b.creada?-1:1));
 const t=p=>{const e=estado(p);return '<div class="pfc" data-pf="'+esc(p.id)+'"><div class="l1"><b>'+esc(p.cliente)+'</b><span class="bd '+e[1]+'">'+e[0]+'</span></div><small>'+esc(p.productos)+' · <b style="font-size:13px">'+money(p.monto)+'</b></small><small>🧾 '+esc(p.tiendaPos||'POS')+' · '+fd(p.creada)+(p.asesor&&p.asesor!==D.persona?' · '+esc(p.asesor):'')+'</small></div>'};
 return '<div class="sh">📋 Mis proformas</div>'+(D.mes.n?'<div class="kp"><div><small>Cerradas este mes</small><b>'+D.mes.cerradas+' de '+D.mes.n+'</b></div><div><small>Vendido por seguimiento</small><b>'+money(D.mes.cerradoUsd)+'</b></div></div>':'')+
  (ab.length?'<div class="intro">'+(urg.length?'<b style="color:#fff">'+(urg.length===1?'1 cliente espera':urg.length+' clientes esperan')+' tu llamada.</b> ':'')+'Toca una para escribirle y anotar cómo te fue.</div>'+ab.map(t).join(''):'<div class="intro">No tienes proformas abiertas. ¡Todo al día! 🙌</div>')+
  (ce.length?'<div class="sh">Cerradas (30 días)</div>'+ce.map(t).join(''):'')+'<div class="upd">Pedidos del POS sin facturar hechos con tu usuario. Se cierran solos si se facturan.</div>'}
function pinto(){let w=document.getElementById('pfcc');if(!w){w=document.createElement('div');w.id='pfcc';document.getElementById('mi').prepend(w)}
 w.innerHTML=lista();w.querySelectorAll('[data-pf]').forEach(b=>b.onclick=()=>detalle(D.filas.find(p=>p.id===b.dataset.pf)))}
function detalle(p){const e=estado(p);
 abrir('<span class="id">Proforma '+esc(p.doc||p.id)+' · '+esc(p.tiendaPos||'')+'</span><h2>'+esc(p.cliente)+'</h2><p>'+esc(p.productos)+'</p><p><b style="font-size:22px;color:var(--accent)">'+money(p.monto)+'</b> <span class="bd '+e[1]+'">'+e[0]+'</span></p>'+
  (p.correo?'<p style="color:var(--muted)">✉️ '+esc(p.correo)+'</p>':'')+(tel(p)?'<p style="color:var(--muted)">📱 '+esc(p.cel)+'</p>':'')+
  (p.estado==='Abierta'?(tel(p)?'<a class="btn wa" target="_blank" rel="noopener" href="'+wa(p)+'">💬 Escribirle por WhatsApp</a><a class="btn" style="background:#ffffff1c;color:#fff" href="tel:'+tel(p)+'">📞 Llamar</a>':'<p style="color:var(--muted)">El POS no trae su celular. Si lo consigues, anótalo al guardar.</p>')+
   (p.fuera?'<p style="margin-top:12px">Este pedido ya no está pendiente en el POS. ¿Compró? 🤞</p>':'')+
   '<button class="btn ye" id="pfA">✍️ Anotar cómo me fue</button><div class="pfo" style="margin-top:10px"><button id="pfS">🎉 ¡Compró!</button><button id="pfN">No va a comprar</button></div>':'')+
  (p.hist.length?'<h5>Lo que va pasando</h5>'+p.hist.slice().reverse().map(x=>'<div class="pfh">'+fd(x.f)+' · '+esc(x.canal?x.canal+': ':'')+esc(x.res)+(x.nota?'<small>'+esc(x.nota)+'</small>':'')+'</div>').join(''):''));
 const q=s=>document.getElementById(s);if(q('pfA')){q('pfA').onclick=()=>anotar(p);q('pfS').onclick=()=>guardar(p,{estado:'Compró',resultado:'¡Compró!'},fiesta);q('pfN').onclick=()=>perder(p)}}
function sel(g,cb){document.querySelectorAll('[data-'+g+']').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-'+g+']').forEach(x=>x.classList.toggle('on',x===b));cb(b.dataset[g])})}
function anotar(p){let can='WhatsApp',res='',dd=3;
 abrir('<h2>¿Cómo te fue con '+esc(corto(p.cliente))+'?</h2><h5>¿Por dónde?</h5><div class="pfo">'+CAN.map(([e,t],i)=>'<button data-can="'+t+'"'+(i?'':' class="on"')+'>'+e+' '+t+'</button>').join('')+'</div>'+
  '<h5>¿Qué pasó?</h5><div class="pfo">'+RES.map(([e,t])=>'<button data-res="'+t+'">'+e+' '+t+'</button>').join('')+'</div>'+
  '<h5>¿Cuándo le vuelves a escribir?</h5><div class="pfo">'+[[1,'Mañana'],[3,'En 3 días'],[7,'En una semana']].map(([n,t])=>'<button data-dd="'+n+'"'+(n===3?' class="on"':'')+'>'+t+'</button>').join('')+'</div>'+
  (tel(p)?'':'<input class="pfi" id="pfC" inputmode="tel" placeholder="Celular del cliente (si te lo dio)">')+'<input class="pfi" id="pfT" placeholder="Nota para acordarte (opcional)"><button class="btn ye" id="pfG">Guardar</button>');
 sel('can',v=>can=v);sel('res',v=>res=v);sel('dd',v=>dd=+v);
 document.getElementById('pfG').onclick=()=>{if(!res)return toast('Toca qué pasó 👆');const c=document.getElementById('pfC');
  guardar(p,{canal:can,resultado:res,proximo:sum(D.hoy,dd),nota:document.getElementById('pfT').value.trim(),cel:c?c.value.trim():''},()=>{cerrar();toast(ANIMO[Math.floor(Math.random()*ANIMO.length)])})}}
function perder(p){let mot='';
 abrir('<div style="text-align:center"><div style="font-size:44px">💪</div><h2>Esta no se dio. ¡La próxima sí!</h2><p style="color:var(--muted)">Contar por qué nos ayuda: si es el precio o el stock, se puede arreglar.</p></div><div class="pfo">'+D.motivos.map(t=>'<button data-mot="'+t+'">'+(MOT[t]||'•')+' '+t+'</button>').join('')+'</div><input class="pfi" id="pfT" placeholder="Nota (opcional)"><button class="btn ye" id="pfG">Guardar y seguir</button>');
 sel('mot',v=>mot=v);document.getElementById('pfG').onclick=()=>{if(!mot)return toast('Toca qué pasó 👆');guardar(p,{estado:'No compró',resultado:'No compró',motivo:mot,nota:document.getElementById('pfT').value.trim()},()=>{cerrar();toast('Gracias por contarlo. ¡A la siguiente! 💪')})}}
function fiesta(p){abrir('<div class="pff"><div class="e">🎉</div><b>¡Venta cerrada!</b><p>'+esc(corto(p.cliente))+' compró '+money(p.monto)+'. Tu seguimiento hizo la diferencia.</p><button class="btn ye" onclick="cerrar()">¡A seguir! 💪</button></div>')}
function guardar(p,d,ok){const b=document.getElementById('pfG');if(b){b.disabled=true;b.textContent='Guardando…'}
 api('apiPFCCSeguir',CL,p.id,d).then(n=>{n.tiendaPos=p.tiendaPos;n.asesor=p.asesor;const i=D.filas.findIndex(x=>x.id===p.id);if(i>=0)D.filas[i]=n;
  if(d.estado==='Compró'){D.mes.cerradas++;D.mes.cerradoUsd+=n.monto}pinto();ok(n)},e=>{if(b){b.disabled=false;b.textContent='Guardar'}toast(e.message)})}
window.PFCC={init(clave,app){CL=clave;APP=app;const s=document.createElement('style');s.textContent=CSS;document.head.appendChild(s);
 api('apiPFCC',CL).then(d=>{D=d;pinto();const ab=d.filas.filter(p=>p.estado==='Abierta'),urg=ab.filter(p=>!p.hist.length||p.fuera||(p.contacto&&p.contacto<=d.hoy));
  if(!ab.length)return;const m=ab.reduce((a,p)=>a+p.monto,0);
  P.unshift({k:'mi',c:'y',card:'<div class="em">📋</div><div class="big">'+(urg.length||ab.length)+'</div><div class="sub">'+(urg.length?(urg.length===1?'cliente espera':'clientes esperan')+'<br>tu llamada':'proformas en<br>seguimiento')+'</div><div class="sm">'+money(m)+' en juego</div>',
   tag:'Mis proformas',n:'Clientes que cotizaron y aún no compran',w:ab.length+' abiertas · '+money(m)+' en juego',t:'Escríbeles hoy: una llamada a tiempo cierra la venta.',x:'<button class="btn ye" onclick="ver(\'mi\')">Ver mis proformas</button>'});
  const ch=document.querySelector('.chip[data-f=mi]');if(ch.style.display==='none'){ch.style.display='';ch.textContent='Mis proformas'}pinta('todo')}).catch(()=>{})}};
})();
