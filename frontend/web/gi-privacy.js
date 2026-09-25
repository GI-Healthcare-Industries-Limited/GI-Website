/* GI Healthcare: first-party consent UI and strictly opt-in, content-free analytics. */
(() => {
  'use strict';
  if (window.GIPrivacy) return;
  const VERSION='gi-analytics-v2', MAX_AGE=180*86400000;
  let memoryChoice=null, view=null, seconds=0, clicks=0, lastTick=Date.now(), lastAction=Date.now(), stopped=false;
  let lastLocation=location.href, previousFocus=null, promptTimer=null, mounted=false;
  let loaded=document.readyState==='complete';
  const flutterPage=Boolean(document.querySelector('script[src="flutter_bootstrap.js"]'));
  let rendered=!flutterPage||document.documentElement.dataset.giFlutterReady==='true';
  const PROMPT_DELAY=3000;
  const isAdmin=()=>location.pathname.startsWith('/admin')||location.pathname.startsWith('/book/');
  function readChoice(){
    try {
      const raw=document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('gi_privacy='));
      const c=raw?JSON.parse(decodeURIComponent(raw.slice(11))):memoryChoice;
      // Honour prior refusals; prior acceptance does not authorise the new fields.
      return c && (c.v===VERSION || c.v==='gi-analytics-v1' && c.analytics===false) && typeof c.analytics==='boolean' && Number.isFinite(c.at) && c.at<=Date.now() && Date.now()-c.at<MAX_AGE?c:null;
    } catch {return null;}
  }
  function pageName(url=location.href){
    try {const u=new URL(url,location.origin);if(u.origin!==location.origin)return null;
      if(u.pathname==='/'||u.pathname==='/index.html'){const p=u.searchParams.get('page')||'home';return ['home','space','careers'].includes(p)?p:null;}
      // Keep the existing analytics bucket so historical Space views remain available.
      if(u.pathname==='/research')return 'space';
      if(u.pathname==='/careers'||u.pathname.startsWith('/careers/'))return 'careers';
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
    :host{font-family:var(--font-inter,Inter),-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#20221f;font-size:14px;line-height:1.6}
    *{box-sizing:border-box}button,input,a{font:inherit}button,a{touch-action:manipulation}button{cursor:pointer}button:focus-visible,a:focus-visible,input:focus-visible{outline:3px solid #59664b;outline-offset:4px}
    dialog{position:fixed;inset:auto 0 max(24px,env(safe-area-inset-bottom));margin:0 auto;width:calc(100% - 40px);max-width:1120px;max-height:90dvh;overflow:auto;border:1px solid #e1e4df;border-radius:100px;padding:12px;background:#fff;color:#20221f;box-shadow:0 0 0 5px #ffffff50,0 12px 48px #17201824;font:inherit}
    dialog:focus{outline:none}dialog::backdrop{background:#20251e16;backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px)}
    dialog[data-view="preferences"]{max-width:640px;border-radius:24px;padding:28px}
    .layout{display:flex;align-items:center;gap:16px}.copy{display:flex;align-items:center;gap:16px;flex:1;min-width:0}.cookie{display:grid;place-items:center;width:44px;height:44px;flex-shrink:0;border-radius:50%;background:#f3f4f1}.cookie img{width:26px;height:26px}
    h2{font-size:23px;font-weight:550;letter-spacing:-.6px;line-height:1.3;margin:0 0 12px}p{margin:0;color:#53584f;font-size:14px;line-height:1.65}.copy p{color:#343831}.copy a{white-space:nowrap;margin-left:6px}a{color:inherit;text-underline-offset:3px;text-decoration-thickness:1px}a:hover{text-decoration-thickness:2px}
    .actions{display:flex;gap:8px;flex-shrink:0}button{border:1px solid #d9ddd5;border-radius:50px;padding:11px 22px;background:#fff;color:#20221f;font-size:14px;font-weight:550;min-height:46px;line-height:22px}button:hover{background:#f0f2ed}.choice{background:#20221f;color:#fff;border-color:#20221f;min-width:98px}.choice:hover{background:#41473c;border-color:#41473c}.icon-button{display:grid;place-items:center;width:46px;padding:10px;border-color:transparent}.icon-button img{width:24px;height:24px}
    .choice[data-action="reject"]{background:#fff;color:#20221f;border-color:#20221f}.choice[data-action="reject"]:hover{background:#f0f2ed;border-color:#20221f}
    .manage .actions{margin-top:24px;justify-content:flex-end;flex-wrap:wrap}.manage [data-action="back"]{margin-right:auto}.category{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px;padding:23px 0;border-bottom:1px solid #e5e7e1}.category strong{display:block;font-weight:600;margin-bottom:6px}.badge{color:#4c5a3e;white-space:nowrap;font-size:12px;font-weight:550;background:#f0f3eb;border-radius:20px;padding:3px 10px;align-self:start}label{display:flex;align-items:center;gap:8px;cursor:pointer;align-self:start;min-width:77px}input{appearance:none;width:42px;height:26px;margin:0;border:1px solid #7f8579;border-radius:30px;background:#8c9386;position:relative;flex-shrink:0}input:before{content:'';position:absolute;top:4px;left:4px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .12s}input:checked{background:#46563b;border-color:#46563b}input:checked:before{transform:translateX(16px)}
    .fine{font-size:12px;margin-top:20px;line-height:1.7}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
    [hidden]{display:none!important}@media(max-width:760px){dialog{width:calc(100% - 28px);bottom:max(14px,env(safe-area-inset-bottom));border-radius:26px;padding:16px}.layout{flex-direction:column;align-items:stretch;gap:16px}.copy{gap:12px}.copy p{font-size:13px}.copy a{display:inline-block;margin-left:0}.copy .cookie{width:38px;height:38px}.actions{display:grid;grid-template-columns:1fr 1fr 46px}.choice{width:100%;min-width:0}.manage .actions{display:flex}.manage .choice{width:auto;flex:1}.category{gap:14px}dialog[data-view="preferences"]{padding:22px;max-height:92dvh}}
    @media(max-width:760px){.manage button{padding-inline:10px}.category{gap:10px 14px;padding:18px 0}.category>div{display:contents}.category strong{grid-column:1;grid-row:1;margin:0}.category p{grid-column:1/-1}.category>label,.category>.badge{grid-column:2;grid-row:1}}
    @media(prefers-reduced-motion:reduce){*{transition:none!important}}
  </style>
  <dialog aria-labelledby="gi-privacy-title" tabindex="-1" data-view="summary">
    <div class="layout" id="summary">
      <div class="copy"><span class="cookie" aria-hidden="true"><img src="/privacy-icons/cookie.svg" alt="" width="26" height="26"></span><h2 id="gi-privacy-title" class="sr-only">Your privacy choices</h2><p>We use optional analytics to improve your experience. <a href="/privacy" target="_blank" rel="noopener">Privacy policy</a></p></div>
      <div class="actions"><button type="button" class="choice" data-action="accept">Accept</button><button type="button" class="choice" data-action="reject">Reject</button><button type="button" class="icon-button" data-action="manage" aria-label="Manage cookie choices" title="Manage cookie choices"><img src="/privacy-icons/sliders.svg" alt="" width="24" height="24"></button></div>
    </div>
    <div class="manage" id="preferences" hidden>
      <h2 id="gi-preferences-title">Manage your privacy choices</h2><p>You decide whether to allow optional analytics. The website and application forms work either way.</p>
      <div class="category"><div><strong>Strictly necessary</strong><p>Security, essential administrator sign-in and remembering your privacy choice. These functions cannot be switched off here.</p></div><span class="badge">Always on</span></div>
      <div class="category"><div><strong id="analytics-label">Website analytics</strong><p id="analytics-help">Page views, navigation clicks, approximate active time, estimated country/region/city, device/browser/operating-system category and referral category. The owner can view these details for individual page views. No form answers, passwords, typing, recordings or precise location. Full IP addresses are not retained in our analytics database.</p></div><label><input aria-labelledby="analytics-label" aria-describedby="analytics-help" id="analytics" type="checkbox" role="switch"><span id="toggle-state">Off</span></label></div>
      <p class="fine">GI Healthcare operates these first-party analytics using Vercel and Supabase; Cloudflare provides domain/network services. Analytics records expire after 30 days. Your choice is remembered on this browser for 180 days. Service providers also process connection/security information, including IP addresses, as explained in our <a href="/privacy" target="_blank" rel="noopener">Privacy Notice</a>. No advertising trackers.</p>
      <div class="actions"><button type="button" data-action="back">Back</button><button type="button" class="choice" data-action="reject">Reject</button><button type="button" class="choice" data-action="save">Save choices</button></div>
    </div>
  </dialog>`;
  const dialog=root.querySelector('dialog'),summary=root.querySelector('#summary'),preferences=root.querySelector('#preferences'),toggle=root.querySelector('#analytics');
  function cancelPrompt(){clearTimeout(promptTimer);promptTimer=null;}
  function schedulePrompt(){
    cancelPrompt();
    if(!mounted||!loaded||!rendered||isAdmin()||location.pathname==='/privacy'||readChoice()||dialog.open)return;
    promptTimer=setTimeout(()=>{
      promptTimer=null;
      if(!isAdmin()&&location.pathname!=='/privacy'&&!readChoice()&&!dialog.open)show();
    },PROMPT_DELAY);
  }
  window.addEventListener('load',()=>{loaded=true;schedulePrompt();},{once:true});
  window.addEventListener('flutter-first-frame',()=>{rendered=true;schedulePrompt();},{once:true});
  function state(){root.querySelector('#toggle-state').textContent=toggle.checked?'On':'Off';}
  function show(manage=false){
    cancelPrompt();if(!dialog.open)previousFocus=document.activeElement;toggle.checked=readChoice()?.analytics===true;state();summary.hidden=manage;preferences.hidden=!manage;
    dialog.dataset.view=manage?'preferences':'summary';
    dialog.setAttribute('aria-labelledby',manage?'gi-preferences-title':'gi-privacy-title');
    if(!dialog.open)dialog.showModal();
    (manage?toggle:dialog).focus({preventScroll:true});
  }
  function save(analytics){
    // Stop first: withdrawal must never flush queued activity.
    cancelPrompt();view=null;seconds=0;clicks=0;stopped=false;
    memoryChoice={v:VERSION,analytics,at:Date.now()};
    try {document.cookie='gi_privacy='+encodeURIComponent(JSON.stringify(memoryChoice))+'; Path=/; Max-Age=15552000; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');} catch { /* Storage restrictions must not block access to the site. */ }
    dialog.close();previousFocus?.focus?.();window.dispatchEvent(new CustomEvent('gi:privacy-change',{detail:{analytics}}));begin();
  }
  root.addEventListener('click',e=>{const action=e.target.closest?.('[data-action]')?.dataset.action;if(action==='manage')show(true);if(action==='back')show(false);if(action==='accept')save(true);if(action==='reject')save(false);if(action==='save')save(toggle.checked);});
  toggle.addEventListener('change',state);
  dialog.addEventListener('cancel',e=>{e.preventDefault();if(!readChoice())save(false);else{dialog.close();previousFocus?.focus?.();}});
  window.GIPrivacy={open:()=>show(true),get:()=>readChoice()};
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-gi-privacy-open]')){e.preventDefault();show(true);}});
  function mount(){document.body.append(host);mounted=true;schedulePrompt();if(!isAdmin())begin();}
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
    if(location.href!==lastLocation){const changed=pageName(lastLocation)!==pageName();send();lastLocation=location.href;if(isAdmin()&&dialog.open)dialog.close();if(changed)begin();schedulePrompt();}
    if(!permitted()){view=null;lastTick=now;return;}
    if(view&&!document.hidden&&!dialog.open&&now-lastAction<60000)seconds=Math.min(1800,seconds+Math.min(2,(now-lastTick)/1000));
    lastTick=now;
  },1000);
  setInterval(send,30000);
})();
