/* The Bhagwat Real Estate — lightweight browser admin
   NOTE: This is a static HTML/CSS/JS admin. Changes are stored in this browser's localStorage.
   They do not sync to other visitors. For multi-device/live server changes, connect a backend/CMS.
*/
(() => {
  const STORAGE_KEY = 'tbre_admin_v2';

  const defaultState = {
    settings: {
      heroEyebrow: 'LAND · LEGACY · LOCATION',
      heroTitle: 'Where the right land',
      heroEmphasis: 'changes everything.',
      heroCopy: 'Curated real-estate opportunities across the Delhi–Jaipur corridor — from strategic land and R-Zone parcels to premium farmhouses, residential and commercial assets.',
      aboutTitle: 'A sharper way to find valuable land.',
      aboutText: 'The Bhagwat Real Estate connects buyers with land and property opportunities where location, access and long-term potential matter.',
      founderName: 'Pavan Kaushik',
      founderRole: 'Founder · The Bhagwat Real Estate',
      phone: '+91 97281 11777',
      email: 'pvnkaushik@gmail.com'
    },
    properties: []
  };

  const qs = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const load = () => { try { const x = JSON.parse(localStorage.getItem(STORAGE_KEY)); return x ? {...defaultState,...x,settings:{...defaultState.settings,...x.settings}} : null; } catch { return null; } };
  const save = s => localStorage.setItem(STORAGE_KEY, JSON.stringify(s));

  // Read the site's original property array by intercepting the global after script.js loads.
  function getBaseProperties(){ return Array.isArray(window.TBRE_PROPERTIES) ? window.TBRE_PROPERTIES : []; }
  function state(){
    let s = load();
    if(!s){ s = {...defaultState, properties:getBaseProperties().map(p=>({...p,status:'available'}))}; save(s); }
    return s;
  }

  function applyState(){
    const s = state();
    const setText = (sel,val) => { const el=qs(sel); if(el && val) el.textContent=val; };
    setText('[data-admin="hero-eyebrow"]',s.settings.heroEyebrow);
    setText('[data-admin="hero-title"]',s.settings.heroTitle);
    setText('[data-admin="hero-emphasis"]',s.settings.heroEmphasis);
    setText('[data-admin="hero-copy"]',s.settings.heroCopy);
    setText('[data-admin="about-title"]',s.settings.aboutTitle);
    setText('[data-admin="about-text"]',s.settings.aboutText);
    setText('[data-admin="founder-name"]',s.settings.founderName);
    setText('[data-admin="founder-role"]',s.settings.founderRole);
    document.querySelectorAll('[data-admin-phone]').forEach(el=>{el.textContent=s.settings.phone; if(el.tagName==='A') el.href='tel:'+s.settings.phone.replace(/\D/g,'');});
    document.querySelectorAll('[data-admin-email]').forEach(el=>{el.textContent=s.settings.email; if(el.tagName==='A') el.href='mailto:'+s.settings.email;});
    if(typeof window.renderProperties==='function') window.renderProperties();
  }

  async function verifyPin(pin){
    // Deliberately avoid putting the PIN beside the UI label. Hashing is only obfuscation for a static site, not real security.
    const data = new TextEncoder().encode(pin);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const hash = [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
    return hash === '1b7b63a9c21ee95fe370262fb15fe07a051f3ef67c8f97edeee11d33ec3881b4';
  }
  // Fallback for local file/privacy contexts; keeps the exact PIN out of visible HTML.

  function openAdmin(){ qs('#adminOverlay').classList.add('show'); renderAdmin(); }
  function closeAdmin(){ qs('#adminOverlay').classList.remove('show'); }
  function renderAdmin(){
    const s=state();
    qs('#adminProperties').innerHTML=s.properties.map((p,i)=>`<tr>
      <td><strong>${esc(p.title)}</strong><small>${esc(p.location)}</small></td>
      <td>${esc(p.type)}</td><td>${esc(p.price)}</td><td><span class="admin-status ${p.status==='sold'?'sold':''}">${p.status==='sold'?'SOLD':'LIVE'}</span></td>
      <td class="admin-actions"><button data-edit="${i}">Edit</button><button data-sold="${i}">${p.status==='sold'?'Mark Live':'Mark Sold'}</button><button class="danger" data-delete="${i}">Delete</button></td>
    </tr>`).join('');
    const f=qs('#propertyForm'); if(f && !f.dataset.editing) f.reset();
    qs('#adminCount').textContent=`${s.properties.length} listings`;
    qs('#settingsForm').querySelector('[name=heroEyebrow]').value=s.settings.heroEyebrow;
    qs('#settingsForm').querySelector('[name=heroTitle]').value=s.settings.heroTitle;
    qs('#settingsForm').querySelector('[name=heroEmphasis]').value=s.settings.heroEmphasis;
    qs('#settingsForm').querySelector('[name=heroCopy]').value=s.settings.heroCopy;
    qs('#settingsForm').querySelector('[name=aboutTitle]').value=s.settings.aboutTitle;
    qs('#settingsForm').querySelector('[name=aboutText]').value=s.settings.aboutText;
    qs('#settingsForm').querySelector('[name=founderName]').value=s.settings.founderName;
    qs('#settingsForm').querySelector('[name=founderRole]').value=s.settings.founderRole;
  }

  function wire(){
    qs('#adminPinBtn').addEventListener('click',()=>{ qs('#pinModal').classList.add('show'); setTimeout(()=>qs('#adminPin').focus(),100); });
    qs('#pinClose').addEventListener('click',()=>qs('#pinModal').classList.remove('show'));
    qs('#pinForm').addEventListener('submit',async e=>{e.preventDefault();const pin=qs('#adminPin').value;const ok=await verifyPin(pin);if(ok){qs('#pinModal').classList.remove('show');qs('#adminPin').value='';openAdmin();}else{qs('#pinError').textContent='Incorrect PIN. Please try again.';qs('#adminPin').select();}});
    qs('#adminClose').addEventListener('click',closeAdmin);
    qs('#settingsForm').addEventListener('submit',e=>{e.preventDefault();const s=state();new FormData(e.currentTarget).forEach((v,k)=>s.settings[k]=v);save(s);applyState();renderAdmin();flash('Website settings saved in this browser.');});
    qs('#propertyForm').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget,s=state();const d=Object.fromEntries(new FormData(f));d.id=Date.now();d.status='available';const idx=f.dataset.editing;if(idx!==undefined&&idx!==''){d.id=s.properties[idx].id;d.status=s.properties[idx].status;s.properties[idx]=d;delete f.dataset.editing;qs('#propertySaveBtn').textContent='Add Property';}else s.properties.unshift(d);save(s);applyState();renderAdmin();f.reset();flash('Property saved.');});
    qs('#propertyCancelBtn').addEventListener('click',()=>{const f=qs('#propertyForm');delete f.dataset.editing;f.reset();qs('#propertySaveBtn').textContent='Add Property';});
    qs('#adminProperties').addEventListener('click',e=>{const btn=e.target.closest('button');if(!btn)return;const s=state(),i=Number(btn.dataset.edit??btn.dataset.sold??btn.dataset.delete);if(btn.dataset.edit!==undefined){const p=s.properties[i],f=qs('#propertyForm');Object.entries(p).forEach(([k,v])=>{if(f.elements[k])f.elements[k].value=v});f.dataset.editing=i;qs('#propertySaveBtn').textContent='Update Property';f.scrollIntoView({behavior:'smooth',block:'center'});}else if(btn.dataset.sold!==undefined){s.properties[i].status=s.properties[i].status==='sold'?'available':'sold';save(s);applyState();renderAdmin();}else if(btn.dataset.delete!==undefined){if(confirm('Delete this property from the local website data?')){s.properties.splice(i,1);save(s);applyState();renderAdmin();}}});
    qs('#exportBtn').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(state(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='bhagwat-real-estate-data.json';a.click();URL.revokeObjectURL(a.href);});
    qs('#importInput').addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{const data=JSON.parse(r.result);if(!data.properties||!data.settings)throw Error();save(data);applyState();renderAdmin();flash('Data imported.');}catch{alert('Invalid admin data file.')}};r.readAsText(file);});
    qs('#resetBtn').addEventListener('click',()=>{if(confirm('Reset all local admin changes to the original demo data?')){localStorage.removeItem(STORAGE_KEY);applyState();renderAdmin();flash('Demo data restored.');}});
  }
  function flash(t){const x=qs('#adminFlash');x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),2200);}
  window.TBRE_ADMIN={state,applyState};
  document.addEventListener('DOMContentLoaded',()=>{wire();setTimeout(applyState,0);});
})();
