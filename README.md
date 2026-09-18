# Marketplace App

Expo + expo-router + Supabase multi-vendor marketplace.

## Setup

### 1. Install
```bash
npm install
```

### 2. Supabase keys
Copy `.env.example` to `.env` and set:

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
EXPO_PUBLIC_PAYMENT_API_URL=https://YOUR-PAYMENT-API-URL
```

Never put the service_role key or Lipila secret in the app.

### 3. Database
Run `supabase/schema.sql`, then `supabase/security-fixes.sql`, in the Supabase SQL Editor.

### 4. Payment backend (Edge Functions)
The Lipila secret key must never go in the app. Deploy the two Edge
Functions in `supabase/functions/` instead — they hold the key server-side:

```bash
supabase functions deploy create-payment
supabase functions deploy verify-payment
supabase secrets set LIPILA_SECRET_KEY=your-real-lipila-key
```

Then set `EXPO_PUBLIC_PAYMENT_API_URL` to your project's functions base URL:
```
https://YOUR-PROJECT-REF.supabase.co/functions/v1
```

### 5. Super Admin
Sign up with email, then:

```sql
insert into public.platform_admins (user_id) values ('YOUR-UUID');
```

### 6. Support email
Admin → Footer → Support email (saved in `settings.support_email`).

### 7. Run
```bash
npx expo start
```

### 8. EAS
```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://...."
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "...."
eas secret:create --name EXPO_PUBLIC_PAYMENT_API_URL --value "https://...."
eas build --platform android --profile preview
```

## Notes
- Home banners auto-swap above shops when admin posts 2+.
- Admin can add / rename / delete categories.
- Product badges stored on `products.badges`.
- Payment secrets stay on your backend only.
