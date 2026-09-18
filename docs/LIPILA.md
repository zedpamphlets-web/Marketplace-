# Lipila structure (from Hairbay)

Live API: `https://blz.lipila.io/api/v1`
Header: `x-api-key: LIPILA_SECRET_KEY`

⚠️ This key is only ever read server-side, inside
`supabase/functions/_shared/lipila.ts`, from `Deno.env.get("LIPILA_SECRET_KEY")`.
It must never be added to `.env`, EAS secrets, or any file the Expo app
bundles — that would ship it to every phone that installs the app. Set it
with `supabase secrets set LIPILA_SECRET_KEY=...` instead.

## Collect
`POST /collections/mobile-money`

```json
{
  "referenceId": "uuid",
  "amount": 150,
  "narration": "Order …",
  "accountNumber": "2609XXXXXXXX",
  "currency": "ZMW"
}
```

Optional header: `callbackUrl`

Network is auto-detected from the number. App only sends `mtn` | `airtel` | `zamtel` for our own records.

## Status
`GET /collections/check-status?referenceId=…`

Mapped in-app:

- Successful → paid
- Failed → failed
- anything else → pending

## Phone
`0960…` / `+260960…` / `960…` → `260960…`
