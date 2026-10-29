// OPTIONAL Razorpay starter. Do not enable until credentials and server-side validation are configured.
// Configure secrets in Supabase: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET.
// Production implementation should create the database order and calculate amount from server-side products first.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods":"POST, OPTIONS" };
const reply=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{...cors,"Content-Type":"application/json"}});
Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST")return reply({error:"Method not allowed"},405);
  // Intentionally disabled: wire this to a validated pending order before collecting payment.
  // Never accept a total amount from the browser and pass it straight to Razorpay.
  const keyId=Deno.env.get("RAZORPAY_KEY_ID"),keySecret=Deno.env.get("RAZORPAY_KEY_SECRET");
  if(!keyId||!keySecret)return reply({error:"Razorpay credentials are not configured."},503);
  return reply({error:"Payment order creation is not enabled in this starter. Follow README payment setup before accepting online payments."},501);
});
