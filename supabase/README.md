# Supabase Setup

1. Open the Supabase SQL Editor for project `bbulldbmcpqgrxnnfbzt`.
2. Run `schema.sql`.
3. Copy the project's publishable/anon key into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://bbulldbmcpqgrxnnfbzt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

4. Migrate the existing Firebase records:

```sh
npm run migrate:supabase
```

The migration preserves Firebase document IDs so participant, prize, and draw-result relationships remain intact.

The policies in `schema.sql` preserve the current app's client-side admin behavior. For production security, replace the custom admin login with Supabase Auth and restrict write policies to authenticated admins.
