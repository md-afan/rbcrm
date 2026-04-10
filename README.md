# Ruban Core CRM

Role-based SaaS CRM built around a single `leads` table where one row stores the full client lifecycle from lead capture to payment closure.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Supabase Auth, PostgreSQL, Realtime
- Vercel-ready frontend structure

## Local setup

1. Install dependencies with `npm install`
2. Copy `.env.example` to `.env.local`
3. Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Run the SQL in [supabase/schema.sql](/e:/Startup/Ruban%20Core/Web/RubanCore/crmsystem/supabase/schema.sql)
5. Apply the policies in [supabase/rls.sql](/e:/Startup/Ruban%20Core/Web/RubanCore/crmsystem/supabase/rls.sql)
6. Start the app with `npm run dev`

## Included modules

- `/login` email/password authentication
- `/dashboard` role-aware metrics and daily task summary
- `/crm` master table with filters, progress tracking, and edit drawer
- realtime lead updates through Supabase subscriptions
- shared validation logic for lifecycle transitions

## Important note on strict column updates

Supabase RLS is excellent for row visibility, but true per-column update enforcement is better finalized with RPC wrappers or validation triggers. The project includes:

- a frontend payload guard
- role-aware section editors
- SQL notes in [supabase/policies-notes.sql](/e:/Startup/Ruban%20Core/Web/RubanCore/crmsystem/supabase/policies-notes.sql)

That keeps the architecture aligned with your single-table requirement while documenting the production hardening path.
