# Envoi de l'estimation par e-mail — mise en route

Le calculateur (`/ki-agenten-automatisierung`, `/fr/…`, `/en/…`) :

1. génère le PDF récapitulatif **dans le navigateur** (téléchargement immédiat) ;
2. envoie l'estimation à `POST /api/estimate` ;
3. la fonction `api/estimate.mjs` envoie, **via Resend**, un e-mail depuis
   `info@zbinden.online` au visiteur, avec le PDF en pièce jointe + le lien Calendly,
   et une copie discrète (BCC) vers `info@zbinden.online`.

Tant que Resend n'est pas configuré, le PDF se télécharge quand même ; seul l'e-mail
échoue et le visiteur voit « écrivez-moi à info@zbinden.online ».

## 1. Compte Resend

1. Créer un compte sur https://resend.com (plan gratuit : 3 000 e-mails/mois, 100/jour).
2. **Add Domain** → `zbinden.online`.
3. Resend affiche 3 enregistrements DNS à ajouter là où sont gérés les DNS de
   `zbinden.online` (registrar, ou Vercel si le domaine y est délégué) :
   - un `TXT` SPF (`send.zbinden.online` → `v=spf1 include:amazonses.com ~all`)
   - un `TXT` DKIM (`resend._domainkey…`)
   - un `MX` + `TXT` pour le return-path (`send.zbinden.online`)
   Valeurs exactes = celles affichées par Resend.
4. Attendre la vérification (quelques minutes à ~1 h) → statut **Verified**.
5. **API Keys** → *Create API Key* (permission *Sending access*) → copier la clé
   (`re_…`), visible une seule fois.

## 2. Variable d'environnement Vercel

Dashboard Vercel → projet `zbinden-online` → **Settings → Environment Variables** :

| Name             | Value                    | Environments               |
|------------------|--------------------------|----------------------------|
| `RESEND_API_KEY` | `re_…` (la clé Resend)   | Production, Preview         |
| `ESTIMATE_BCC`   | `info@zbinden.online`    | (optionnel — copie interne) |

Puis **Redeploy** (ou `git push`, le déploiement se relance).

## 3. Vérifier

- `curl -i -X POST https://www.zbinden.online/api/estimate` → doit répondre `400`
  (corps invalide) et **pas** `404` : la fonction est bien déployée.
- Tester le formulaire sur la page : le PDF se télécharge **et** un e-mail arrive
  (vérifier aussi les spams la première fois).
- Le dashboard Resend → **Logs** montre chaque envoi et les éventuelles erreurs.

## Détails techniques

- Aucune dépendance npm : `api/estimate.mjs` appelle l'API REST de Resend avec
  `fetch` (Node 18+ sur Vercel). Pas besoin de `package.json`.
- Expéditeur : `Zbinden Software <info@zbinden.online>`, `reply_to` identique.
- Limite de taille du PDF acceptée par la fonction : ~8 Mo de base64
  (le PDF réel fait ~0,5 Mo, police incluse).
- Langue de l'e-mail : champ `lang` envoyé par la page (`fr` / `de` / `en`).
- Pour changer le texte de l'e-mail : objet `COPY` en haut de `api/estimate.mjs`.
