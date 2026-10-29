// Supabase Edge Function: create-order
// Deploy with: supabase functions deploy create-order --no-verify-jwt
// Configure secrets: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
// Public endpoint: add rate limiting/CAPTCHA before a production launch.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json" },
});
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const { customer_name, customer_phone, delivery_address, items, checkout_method = "whatsapp" } = await req.json();
    if (typeof customer_name !== "string" || customer_name.trim().length < 2 || customer_name.length > 120) return json({ error: "Enter a valid customer name." }, 400);
    if (typeof customer_phone !== "string" || !/^[0-9+\-\s()]{8,24}$/.test(customer_phone)) return json({ error: "Enter a valid phone number." }, 400);
    if (typeof delivery_address !== "string" || delivery_address.trim().length < 8 || delivery_address.length > 1000) return json({ error: "Enter a complete delivery address." }, 400);
    if (!Array.isArray(items) || items.length < 1 || items.length > 30) return json({ error: "Cart is empty or contains too many different items." }, 400);
    if (!["whatsapp", "cod"].includes(checkout_method)) return json({ error: "Unsupported checkout method." }, 400);

    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return json({ error: "Server is not configured. Contact the store owner." }, 500);
    const db = createClient(url, key, { auth: { persistSession: false } });

    // Re-read product names/prices/stock on the server. Never trust client prices.
    const normalized = new Map<string, number>();
    for (const item of items) {
      const id = typeof item.product_id === "string" ? item.product_id : "";
      const qty = Number(item.quantity);
      if (!id || !/^[0-9a-f-]{36}$/i.test(id) || !Number.isInteger(qty) || qty < 1 || qty > 100) {
        return json({ error: "A cart item is invalid. Refresh the shop and try again." }, 400);
      }
      normalized.set(id, (normalized.get(id) || 0) + qty);
    }
    const ids = [...normalized.keys()];
    const { data: productRows, error: pErr } = await db.from("products").select("id,name,price,weight,stock_quantity,is_active").in("id", ids);
    if (pErr) throw pErr;
    if (!productRows || productRows.length !== ids.length) return json({ error: "One or more products are no longer available." }, 400);
    const orderItems = [];
    let subtotal = 0;
    for (const p of productRows) {
      const quantity = normalized.get(p.id)!;
      if (!p.is_active || p.stock_quantity < quantity) return json({ error: `${p.name} is currently unavailable in the requested quantity.` }, 409);
      const unitPrice = Number(p.price);
      subtotal += unitPrice * quantity;
      orderItems.push({ product_id: p.id, product_name: p.name, quantity, unit_price: unitPrice });
    }
    if (subtotal <= 0 || subtotal > 500000) return json({ error: "Order total is outside the allowed range." }, 400);
    const orderNumber = `MM-${new Date().toISOString().slice(0,10).replaceAll("-","")}-${crypto.randomUUID().slice(0,6).toUpperCase()}`;
    const { data: order, error: oErr } = await db.from("orders").insert({
      order_number: orderNumber, customer_name: customer_name.trim(), customer_phone: customer_phone.trim(),
      delivery_address: delivery_address.trim(), subtotal, delivery_fee: 0, total_amount: subtotal,
      status: "pending", payment_status: "unpaid", payment_method: checkout_method,
    }).select("id,order_number,total_amount").single();
    if (oErr) throw oErr;
    const { error: iErr } = await db.from("order_items").insert(orderItems.map(i => ({ ...i, order_id: order.id })));
    if (iErr) {
      await db.from("orders").delete().eq("id", order.id);
      throw iErr;
    }
    return json({ success: true, order_id: order.id, order_number: order.order_number, total_amount: order.total_amount });
  } catch (err) {
    console.error("create-order error", err);
    return json({ error: "Could not create the order. Please try again or contact the store." }, 500);
  }
});
