# E-Mail Setup – 1A Motor

## Schritt 1: Resend Account (kostenlos)
1. Gehe auf https://resend.com → kostenlos registrieren
2. Domain verifizieren: resend.com → Domains → Add Domain → "1amotor.de"
3. DNS TXT-Eintrag bei United Domains eintragen (Resend zeigt dir genau was)
4. API Key erstellen: resend.com → API Keys → Create API Key → kopieren

## Schritt 2: Supabase Edge Function deployen
```bash
# Supabase CLI installieren (einmalig)
npm install -g supabase

# Einloggen
supabase login

# In deinem Projektordner
supabase functions deploy send-inquiry-email --project-ref xaqfptumjkmulobdbfid
```

## Schritt 3: API Key als Secret setzen
```bash
supabase secrets set RESEND_API_KEY=re_deinApiKeyHier --project-ref xaqfptumjkmulobdbfid
```

## Alternativ ohne CLI (über Supabase Dashboard):
1. Supabase → Edge Functions → Create new function
2. Code aus supabase/functions/send-inquiry-email/index.ts einfügen
3. Supabase → Settings → Edge Functions → Add secret: RESEND_API_KEY

## Resend Free Tier:
- 3.000 E-Mails / Monat kostenlos
- Reicht für den Anfang problemlos
