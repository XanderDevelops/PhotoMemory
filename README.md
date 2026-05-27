# Photo Memory

Merged Photo Memory web, admin dashboard, Supabase functions, challenge content, and desktop admin shell. The root `index.html` is the public Photo Memory landing page, and `dashboard/` is the shared player/admin dashboard.

## Local web preview

```bash
npm start
```

Open `http://127.0.0.1:4173` for the public site and `http://127.0.0.1:4173/dashboard/` for the player dashboard.

The local server also redirects the old separated `PhotoMemoryDashboard` path to `/dashboard/`.

## Dashboard and admin setup

The dashboard uses email OTP login for players and admins. Normal users see their own stats, high scores, history, and leaderboard. Accounts with `user_profiles.role = 'admin'` also get the admin tabs.

1. Run the SQL migration in `supabase/migrations/202605260001_admin_roles_notifications.sql`.
2. Promote your account:

```sql
update public.user_profiles
set role = 'admin'
where id = (select id from auth.users where email = 'your-email@example.com');
```

3. Deploy the functions in `supabase/functions/admin-api` and `supabase/functions/send-unverified-reminders`.
4. Set these Supabase function secrets:

```text
RESEND_API_KEY=
RESEND_FROM_EMAIL=Photo Memory <photomemory@quotecel.com>
PUBLIC_SITE_URL=https://photographicmemory.vercel.app
ADMIN_CRON_SECRET=
```

The dashboard uses the anon key in browser code, but all privileged user management runs through the `admin-api` Edge Function after checking `user_profiles.role = 'admin'`.

Pushing the static site is not enough for the dashboard data to work. The `leaderboard_profiles` view, profile policies, and admin function must be live in Supabase:

```bash
supabase db push
supabase functions deploy admin-api
supabase functions deploy send-unverified-reminders
```

## Electron admin

The desktop shell lives in `electron-admin/`.

```bash
npm run electron
```

It opens the same dashboard and adds a ChatGPT side browser plus local tools for the daily challenge image folder.
