# Makhana Magic — Complete Website + Supabase Backend Starter

This project follows the same overall structure as the Swad Sangam project: static storefront, separate admin page, browser configuration, Supabase SQL schema and Edge Functions.

## Included
- Responsive customer storefront: product catalogue, search, category filters, cart and checkout form.
- Supabase product catalogue and database schema.
- Admin login via Supabase Auth.
- Admin dashboard for products (create/edit/delete, price, stock, image URL, active visibility) and order status management.
- Server-side order creation Edge Function. The server reads current product prices/stock from Supabase instead of trusting the browser.
- WhatsApp handoff after an order is saved.
- Optional Razorpay Edge Function placeholders (not enabled for live payment).
- SQL Row Level Security (RLS) policies.
- Setup notes.

## Project files
- `index.html` — customer storefront
- `admin.html` — admin dashboard
- `assets/app.js` — storefront logic
- `assets/admin.js` — admin logic
- `assets/style.css` — design and responsive layout
- `assets/config.js` — public project URL and anon/publishable key placeholders
- `supabase/schema.sql` — tables, indexes and RLS
- `supabase/functions/create-order/index.ts` — server-side order creation
- `supabase/functions/create-razorpay-order/index.ts` — disabled optional payment starter
- `supabase/functions/verify-razorpay-payment/index.ts` — disabled optional verification starter

## A. Configure Supabase
1. Create a Supabase project at https://supabase.com/.
2. Open **Project Settings → API** (or API Keys) and copy the Project URL and public publishable/anon key.
3. Edit `assets/config.js` and replace `YOUR-PROJECT-REF` and `YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY`. Set the actual shop email, phone and WhatsApp number.
4. In Supabase **SQL Editor**, run all of `supabase/schema.sql`.
5. In **Authentication → Users**, create the store owner's user with email/password.
6. Copy that user's UUID and run this in SQL Editor:
   `insert into public.user_roles(user_id, role) values ('PASTE-AUTH-USER-UUID-HERE','admin');`
7. Deploy the order function with Supabase CLI:
   - Install Supabase CLI and sign in.
   - `supabase link --project-ref YOUR_PROJECT_REF`
   - `supabase functions deploy create-order --no-verify-jwt`
   - Set function secrets in Supabase dashboard or CLI: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. The service-role key is server-side only.
8. Set `CREATE_ORDER_FUNCTION_URL` in `assets/config.js` to `https://YOUR-PROJECT-REF.supabase.co/functions/v1/create-order`.
9. Upload the whole project contents (files inside this folder, not the enclosing folder) to the root of your GitHub repository. Commit changes.
10. Publish via GitHub Pages: Settings → Pages → Deploy from a branch → `main` → `/ (root)`.

## B. Important security details
- The browser may contain only the Supabase URL and public anon/publishable key. These are not service secrets; RLS must be enabled.
- NEVER put `SUPABASE_SERVICE_ROLE_KEY`, Razorpay secret, or other private credentials in `assets/config.js` or any frontend file.
- The order Edge Function is public in this starter. Add rate limiting and CAPTCHA/abuse protection before a production launch. Validate delivery areas and shipping rules for your business.
- Admin access depends on an Auth user being added to `public.user_roles` with role `admin`. Creating an Auth user alone does not grant admin privileges.
- Review policies for your business and run security tests before accepting live orders.
- The schema currently allows public reads of active products only. Orders and order items are not publicly readable.
- The admin order list only works after the Edge Function is deployed and orders exist.

## C. Product images
The admin form accepts an image URL. For a production upload experience, create a Supabase Storage bucket and restrict write access to admins. Use stable public URLs only for images intended to be public.

## D. Online payments
Razorpay files are intentionally **disabled placeholders**, not a working payment integration. Do not advertise or accept online payment until you implement and test:
1. server-side Razorpay order creation based on a validated database order;
2. server-side signature verification;
3. webhook signature verification and idempotent payment updates;
4. order status/payment status updates only after trusted verification.
Use Razorpay's official docs: https://razorpay.com/docs/

## E. Local preview
Open `index.html` in a browser to preview the visual design. The catalogue shows demo items until Supabase is configured. Because this is a static site, browser/CDN access is needed for the Supabase JavaScript library.

## F. Launch checklist
- Replace contact details and WhatsApp number.
- Replace demo products with actual products and real prices.
- Verify product ingredients, allergens, net quantity, nutrition and mandatory packaged-food labelling for the actual products.
- Add shipping, return, privacy and terms pages.
- Test admin login, product changes, stock values, order creation and WhatsApp flow.
- Add rate limiting/CAPTCHA, monitoring and backups before production.
