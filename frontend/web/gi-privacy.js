/* GI Healthcare: first-party consent UI and strictly opt-in, content-free analytics. */
(() => {
  'use strict';
  if (window.GIPrivacy) return;
  const VERSION='gi-analytics-v1', MAX_AGE=180*86400000;
  let memoryChoice=null, view=null, seconds=0, clicks=0, lastTick=Date.now(), lastAction=Date.now(), stopped=false;
  let lastLocation=location.href, previousFocus=null;
  const isAdmin=()=>location.pathname.startsWith('/admin');
  function readChoice(){
    try {
      const raw=document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('gi_privacy='));
      const c=raw?JSON.parse(decodeURIComponent(raw.slice(11))):memoryChoice;
      return c && c.v===VERSION && typeof c.analytics==='boolean' && Number.isFinite(c.at) && c.at<=Date.now() && Date.now()-c.at<MAX_AGE?c:null;
    } catch {return null;}
  }
  function pageName(url=location.href){
    try {const u=new URL(url,location.origin);if(u.origin!==location.origin)return null;
      if(u.pathname==='/'||u.pathname==='/index.html'){const p=u.searchParams.get('page')||'home';return ['home','space','careers'].includes(p)?p:null;}
      return ['/contact','/apply','/privacy'].includes(u.pathname)?u.pathname.slice(1):null;
    } catch{return null;}
  }
  function source(){
    try{const h=new URL(document.referrer).hostname;if(h===location.hostname)return 'Direct';
      if(/(^|\.)(google\.[a-z.]+|bing.com|duckduckgo.com|yahoo.com)$/.test(h))return 'Search';
      if(/(^|\.)(linkedin.com|facebook.com|instagram.com|t.co|x.com)$/.test(h))return 'Social';return 'Other';
    }catch{return 'Direct';}
  }
  function permitted(){return !isAdmin() && !stopped && readChoice()?.analytics===true;}
  function send(){
    if(!view||!permitted())return;
    const payload=JSON.stringify({...view,seconds:Math.min(1800,Math.floor(seconds)),clicks:Math.min(100,clicks)});
    fetch('/api/analytics',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:payload,keepalive:true}).then(r=>{if(r.status===429)stopped=true;}).catch(()=>{});
  }
  function begin(){
    view=null;seconds=0;clicks=0;lastTick=Date.now();lastAction=Date.now();
    const p=pageName(),c=readChoice();
    if(!p||!permitted()||!crypto.randomUUID)return;
    view={id:crypto.randomUUID(),page:p,source:source(),version:VERSION,consentAt:c.at};send();
  }
  const host=document.createElement('div');host.id='gi-privacy-controls';
  const root=host.attachShadow({mode:'open'});
  root.innerHTML=`<style>
    :host{font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#f8f5ed;font-size:16px;line-height:1.6}
    *{box-sizing:border-box}button,input,a{font:inherit}button,a{touch-action:manipulation}button{cursor:pointer}button:focus-visible,a:focus-visible,input:focus-visible{outline:3px solid #c6dcb4;outline-offset:4px}
    dialog{position:fixed;inset:auto 0 0;margin:0;width:100%;max-width:none;max-height:90dvh;overflow:auto;border:1px solid #30332d;border-radius:0;padding:28px clamp(24px,3vw,60px);background:#11130f;color:#f8f5ed;box-shadow:0 -12px 50px #0002;font:inherit}
    dialog::backdrop{background:#11130f35;backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px)}
    .layout{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:32px}h2{font-size:22px;font-weight:500;letter-spacing:-.4px;line-height:1.3;margin:0 0 14px}p{margin:0;color:#d2d5ca;font-size:15px;line-height:1.75;max-width:1000px}a{color:inherit;text-underline-offset:4px}
    .actions{display:flex;gap:10px;flex-wrap:wrap}button{border:1px solid #656b5b;border-radius:3px;padding:14px 20px;background:transparent;color:#f8f5ed;font-size:14px;font-weight:550;min-height:48px}button:hover{background:#2b3024}.choice{background:#f8f5ed;color:#20251b;border-color:#f8f5ed}.choice:hover{background:#e3e9d9}
    .manage{max-width:900px;margin:auto}.manage h2{font-size:25px}.manage .actions{margin-top:24px}.category{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px;padding:23px 0;border-bottom:1px solid #373e30}.category strong{display:block;font-weight:550;margin-bottom:6px}.badge{color:#c6dcb4;white-space:nowrap;font-size:14px}label{display:flex;align-items:center;gap:10px;cursor:pointer}input{appearance:none;width:44px;height:26px;margin:0;border:1px solid #959d87;border-radius:30px;background:#414a37;position:relative;flex-shrink:0}input:before{content:'';position:absolute;top:4px;left:4px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .12s}input:checked{background:#8cae6c}input:checked:before{transform:translateX(17px)}
    .fine{font-size:13px;margin-top:20px}.settings{position:fixed;bottom:14px;left:14px;z-index:2147483000;padding:8px 12px;min-height:40px;background:#11130f;color:#fff;border-color:#60664f;font-size:12px;border-radius:5px;box-shadow:0 2px 10px #0002}.settings:hover{background:#303b28}
    [hidden]{display:none!important}@media(max-width:1100px){.layout{grid-template-columns:1fr;gap:20px}.actions{justify-content:flex-start}}@media(max-width:600px){dialog{padding:24px 20px;max-height:92dvh}.layout{gap:22px}.actions{display:grid;grid-template-columns:1fr;width:100%}button{width:100%}.category{gap:14px}.settings{width:auto}h2{font-size:21px}}
    @media(prefers-reduced-motion:reduce){*{transition:none!important}}
  </style>
  <button class="settings" type="button">Cookie settings</button>
  <dialog aria-labelledby="gi-privacy-title">
    <div class="layout" id="summary">
      <div><h2 id="gi-privacy-title">Your privacy choices</h2><p>GI Healthcare uses essential storage to keep this site secure and remember your choices. With your permission, we use optional analytics to understand how our website is used and improve your experience. You can accept or reject optional analytics now and change your choice any time. <a href="/privacy" target="_blank" rel="noopener">Read the Privacy Notice.</a></p></div>
      <div class="actions"><button type="button" data-action="manage">Manage choices</button><button type="button" class="choice" data-action="reject">Reject non-essential</button><button type="button" class="choice" data-action="accept">Accept analytics</button></div>
    </div>
    <div class="manage" id="preferences" hidden>
      <h2 id="gi-preferences-title">Manage your privacy choices</h2><p>You decide whether to allow optional analytics. The website and application forms work either way.</p>
      <div class="category"><div><strong>Strictly necessary</strong><p>Security, essential administrator sign-in and remembering your privacy choice. These functions cannot be switched off here.</p></div><span class="badge">Always on</span></div>
      <div class="category"><div><strong id="analytics-label">Website analytics</strong><p id="analytics-help">Page views, navigation clicks, approximate active time, country, device/browser category and referral category. No form answers, passwords, typing, recordings or precise location. Full IP addresses are not retained in our analytics database.</p></div><label><input aria-labelledby="analytics-label" aria-describedby="analytics-help" id="analytics" type="checkbox" role="switch"><span id="toggle-state">Off</span></label></div>
      <p class="fine">GI Healthcare operates these first-party analytics using Vercel and Supabase; Cloudflare provides domain/network services. Analytics records expire after 30 days. Your choice is remembered on this browser for 180 days. Service providers also process connection/security information, including IP addresses, as explained in our <a href="/privacy" target="_blank" rel="noopener">Privacy Notice</a>. No advertising trackers.</p>
      <div class="actions"><button type="button" data-action="back">Back</button><button type="button" class="choice" data-action="reject">Reject non-essential</button><button type="button" class="choice" data-action="save">Save choices</button></div>
    </div>
  </dialog>`;
  const dialog=root.querySelector('dialog'),settings=root.querySelector('.settings'),summary=root.querySelector('#summary'),preferences=root.querySelector('#preferences'),toggle=root.querySelector('#analytics');
  function state(){root.querySelector('#toggle-state').textContent=toggle.checked?'On':'Off';}
  function show(manage=false){
    previousFocus=document.activeElement;toggle.checked=readChoice()?.analytics===true;state();summary.hidden=manage;preferences.hidden=!manage;
    dialog.setAttribute('aria-labelledby',manage?'gi-preferences-title':'gi-privacy-title');
    if(!dialog.open)dialog.showModal();
    (manage?toggle:root.querySelector('[data-action="manage"]')).focus();
  }
  function save(analytics){
    // Stop first: withdrawal must never flush queued activity.
    view=null;seconds=0;clicks=0;stopped=false;
    memoryChoice={v:VERSION,analytics,at:Date.now()};
    try {document.cookie='gi_privacy='+encodeURIComponent(JSON.stringify(memoryChoice))+'; Path=/; Max-Age=15552000; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');} catch { /* Storage restrictions must not block access to the site. */ }
    dialog.close();previousFocus?.focus?.();window.dispatchEvent(new CustomEvent('gi:privacy-change',{detail:{analytics}}));begin();
  }
  root.addEventListener('click',e=>{const action=e.target.closest?.('[data-action]')?.dataset.action;if(action==='manage')show(true);if(action==='back')show(false);if(action==='accept')save(true);if(action==='reject')save(false);if(action==='save')save(toggle.checked);});
  toggle.addEventListener('change',state);settings.addEventListener('click',()=>show(true));
  dialog.addEventListener('cancel',e=>{e.preventDefault();if(!readChoice())save(false);else{dialog.close();previousFocus?.focus?.();}});
  window.GIPrivacy={open:()=>show(true),get:()=>readChoice()};
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-gi-privacy-open]')){e.preventDefault();show(true);}});
  function mount(){document.body.append(host);if(!isAdmin()){if(!readChoice()&&location.pathname!=='/privacy')show();begin();}else settings.hidden=true;}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  const activity=()=>{if(permitted()&&!dialog.open)lastAction=Date.now();};
  document.addEventListener('pointerdown',activity,{passive:true});
  document.addEventListener('keydown',activity,{passive:true}); // Only timestamp; never key values.
  document.addEventListener('scroll',activity,{passive:true,capture:true});
  document.addEventListener('click',e=>{if(!view||!permitted()||dialog.open||e.composedPath().includes(host))return;const target=e.target.closest?.('a,button,[role="button"]');if(target&&!target.closest('form'))clicks=Math.min(100,clicks+1);},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)send();lastTick=Date.now();});
  window.addEventListener('pagehide',send);
  setInterval(()=>{
    const now=Date.now();
    if(location.href!==lastLocation){const changed=pageName(lastLocation)!==pageName();send();lastLocation=location.href;settings.hidden=isAdmin();if(isAdmin()&&dialog.open)dialog.close();if(changed)begin();if(!isAdmin()&&!readChoice()&&location.pathname!=='/privacy'&&!dialog.open)show();}
    if(!permitted()){view=null;lastTick=now;return;}
    if(view&&!document.hidden&&!dialog.open&&now-lastAction<60000)seconds=Math.min(1800,seconds+Math.min(2,(now-lastTick)/1000));
    lastTick=now;
  },1000);
  setInterval(send,30000);
})();
