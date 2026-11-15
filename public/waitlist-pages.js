const form=document.querySelector('#leave-form');
const token=location.hash.slice(1);
if(form){
 const result=document.querySelector('#leave-result');const button=form.querySelector('button');
 if(!token){result.textContent='Open the private removal link from your signup, or contact the founder using the link on our privacy page.';button.disabled=true;}
 form.addEventListener('submit',async event=>{event.preventDefault();button.disabled=true;try{const response=await fetch('/api/unsubscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})});const data=await response.json();if(!response.ok)throw new Error(data.error);result.textContent=data.message;button.hidden=true;history.replaceState(null,'',location.pathname);}catch(error){result.textContent=error.message||'Please try again shortly.';button.disabled=false;}});
}
