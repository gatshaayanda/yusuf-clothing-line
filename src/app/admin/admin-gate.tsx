"use client";
import {onAuthStateChanged,signInWithCustomToken,signOut,type User} from "firebase/auth";
import {doc,onSnapshot} from "firebase/firestore";
import {useEffect,useState} from "react";
import {auth,db,hasFirebaseWebConfig} from "@/lib/firebase/client";

function hasAdminRole(data:Record<string,unknown>|undefined){
 return ["owner","staff"].includes(String(data?.role??"").toLowerCase());
}

export default function AdminGate({children}:{children:React.ReactNode}){
 const[user,setUser]=useState<User|null>(null),[checking,setChecking]=useState(true),[authorized,setAuthorized]=useState(false),[offline,setOffline]=useState(false),[accessWord,setAccessWord]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);

 useEffect(()=>{
  let stopAdmin:undefined|(()=>void);
  const stopAuth=onAuthStateChanged(auth,next=>{
   if(stopAdmin){stopAdmin();stopAdmin=undefined}
   setUser(next);
   setChecking(true);
   setOffline(false);
   if(!next){setAuthorized(false);setChecking(false);return}
   stopAdmin=onSnapshot(doc(db,"admins",next.uid),snapshot=>{
    const allowed=snapshot.exists()&&hasAdminRole(snapshot.data());
    setAuthorized(allowed);
    setOffline(false);
    setChecking(false);
    if(!allowed)void signOut(auth);
   },()=>{
    setOffline(true);
    setChecking(false);
   });
  });
  return ()=>{if(stopAdmin)stopAdmin();stopAuth()};
 },[]);

 async function signIn(e:React.FormEvent){
  e.preventDefault();setBusy(true);setError("");
  if(!hasFirebaseWebConfig){setError("Yusuf Firebase configuration is missing or points to another project. Sign-in is disabled until .env.local is corrected.");setBusy(false);return;}
  try{
   const response=await fetch("/api/operations-login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({word:accessWord})});
   const payload=await response.json() as {token?:string;error?:string};
   if(!response.ok||!payload.token)throw new Error(payload.error??"Access denied. Check the access word and try again.");
   const credential=await signInWithCustomToken(auth,payload.token);
   const adminSnapshot=await new Promise<{exists:boolean;data:()=>Record<string,unknown>}|null>(resolve=>{
    const stop=onSnapshot(doc(db,"admins",credential.user.uid),snapshot=>{stop();resolve({exists:snapshot.exists(),data:()=>snapshot.data()??{}})},()=>{stop();resolve(null)});
   });
   if(!adminSnapshot||!adminSnapshot.exists||!hasAdminRole(adminSnapshot.data())){
    setError("This account is not enabled for Yusuf Clothing Line Operations.");
    await signOut(auth);
   }else{setAuthorized(true);setOffline(false);setAccessWord("")}
  }catch(err){setError(err instanceof Error?err.message:"We could not sign you in. Check the access word and try again.")}
  finally{setBusy(false)}
 }

 if(checking)return <main className="yusufAdminGate"><div className="yusufAdminGateShell"><div className="yusufAdminGateLoading"><div>🔐</div><h1>Opening Yusuf Clothing Line Admin</h1><p>Checking access…</p></div></div></main>;
 if(user&&authorized)return <div className="yusufAdminAuthorized">{offline&&<div className="yusufAdminAccountBar"><span>Yusuf Clothing Line Admin · Connection unavailable</span><span>Reconnect before saving changes.</span></div>}<div className="yusufAdminAccountBar"><span>Yusuf Clothing Line Admin · {user.email??"authorized staff"}</span><button className="yusufAdminSignOut" type="button" onClick={()=>void signOut(auth)}>Sign out</button></div>{children}</div>;
 return <main className="yusufAdminGate"><div className="yusufAdminGateShell"><section className="yusufAdminGatePanel" style={{maxWidth:520,margin:"80px auto"}}><span className="yusufEyebrow">Yusuf Clothing Line · Operations</span><h1>Operations sign in</h1><p>Enter your Operations access word to manage tailoring requests, services, quotations, fittings and production.</p><form className="yusufAdminGateForm" onSubmit={signIn}><label>Access word<input type="password" value={accessWord} onChange={e=>setAccessWord(e.target.value)} autoComplete="current-password" required autoFocus/></label><button className="yusufAdminSignIn" type="submit" disabled={busy}>{busy?"Checking access…":"Enter Operations"}</button></form>{error&&<p role="alert" className="yusufAdminError">{error}</p>}</section></div></main>
}
