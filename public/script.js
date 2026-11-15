const toggle=document.querySelector('.menu-toggle');
const navigation=document.querySelector('#mobile-nav');
function closeMenu(){if(navigation.open)navigation.close();toggle.setAttribute('aria-expanded','false');document.body.classList.remove('menu-open');}
toggle.addEventListener('click',()=>{navigation.showModal();toggle.setAttribute('aria-expanded','true');document.body.classList.add('menu-open');});
navigation.querySelector('.menu-close').addEventListener('click',closeMenu);
navigation.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
navigation.addEventListener('close',()=>{toggle.setAttribute('aria-expanded','false');document.body.classList.remove('menu-open');toggle.focus();});

const form=document.querySelector('#waitlist-form');
form?.addEventListener('submit',async event=>{
 event.preventDefault();
 if(!form.reportValidity())return;
 const button=form.querySelector('button');
 const result=document.querySelector('#waitlist-result');
 button.disabled=true;button.textContent='JOINING…';result.textContent='';
 try{
  const response=await fetch('/api/waitlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.elements.email.value,consent:form.elements.consent.checked,website:form.elements.website.value})});
  const data=await response.json();
  if(!response.ok)throw new Error(data.error||'We couldn’t save your email. Please try again.');
  result.textContent=data.message;
  if(data.removeUrl){const p=document.createElement('p');const link=document.createElement('a');link.href=data.removeUrl;link.textContent='Your private link to leave the list';p.append(link);result.append(p);const note=document.createElement('p');note.textContent='Save this link if you want to manage your signup later.';result.append(note);}
  form.reset();result.focus();
 }catch(error){result.textContent=error.message;result.focus();}
 finally{button.disabled=false;button.textContent='JOIN THE LAUNCH LIST';}
});
