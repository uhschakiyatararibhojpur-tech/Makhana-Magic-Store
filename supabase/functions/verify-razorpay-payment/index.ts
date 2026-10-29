// OPTIONAL Razorpay verification placeholder. Keep payment verification on the server.
// Do not mark an order as paid based only on the browser's checkout success callback.
const cors = { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods":"POST, OPTIONS" };
const reply=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{...cors,"Content-Type":"application/json"}});
Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST")return reply({error:"Method not allowed"},405);
  return reply({error:"Payment verification is not enabled. Do not accept or record online payments until the verification function is implemented and tested."},501);
});
