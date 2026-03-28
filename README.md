# ScanRight - MVP RM lombosacrale

Piattaforma web per:
- raccogliere dati anamnestici pre-esame;
- valutare l'appropriatezza della RM lombosacrale;
- generare un report PDF da inviare al radiologo.

Stack attuale:
- `Next.js` (frontend + API route);
- `Supabase` (DB in fase test);
- `Vercel` (deploy);
- report PDF generato server-side.

## Avvio locale

1. Copia `.env.example` in `.env.local`.
2. Inserisci le variabili Supabase:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Esegui lo script SQL in `supabase/schema.sql` sul tuo progetto Supabase.
4. Avvia:

```bash
npm install
npm run dev
```

Apri `http://localhost:3000`.

## Flusso implementato

1. Compilazione questionario anamnestico RM lombosacrale.
2. Invio a `POST /api/intake`.
3. Validazione dati e calcolo appropriatezza.
4. Salvataggio in tabella `anamnesi_rm_lombosacrale` (se env Supabase presenti).
5. Generazione PDF e download diretto.

## Collegamento Git + Vercel

### Git

```bash
git init
git add .
git commit -m "Initial ScanRight MVP for lumbar MRI intake"
git branch -M main
git remote add origin <URL_REPOSITORY_GIT>
git push -u origin main
```

### Vercel

1. Importa repository su Vercel.
2. Aggiungi le variabili ambiente del file `.env.local`.
3. Deploy.

## Prossimo step consigliato

- invio automatico del PDF al radiologo via email (es. Resend/SMTP);
- autenticazione e ruoli (accettazione, radiologo, amministratore);
- audit log, consenso privacy, retention e cifratura dati.
