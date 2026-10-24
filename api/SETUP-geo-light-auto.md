# GEO-Light automatique : mise en service

Quand un visiteur confirme son profil dans le formulaire GEO-Light, `api/contact.mjs` appelle
`api/geo-light-run.mjs`, qui pose les 8 questions à ChatGPT et Perplexity, fait rédiger le rapport par Claude (Opus 5.5),
imprime le PDF et crée un **brouillon** de réponse dans `custom-software@zbinden.online`.
Rien ne part chez le client : tu relis le brouillon et tu l'envoies depuis Outlook (aussi sur le téléphone).
Une alerte « Brouillon GEO-Light prêt » arrive à info@ avec le PDF et la transcription des 16 réponses.

Lancement manuel : `https://www.zbinden.online/geo-light-start/` (page non indexée, protégée par le code).

Tant que `GEO_RUN_SECRET` n'existe pas dans Vercel, rien ne change : le formulaire envoie seulement la notification habituelle.

## 1. Application Microsoft (Entra), environ 10 minutes

Il faut une application **séparée** de celle de `envoi_email.py` : celle-là se connecte avec ton compte
(code à saisir), celle-ci doit fonctionner seule sur le serveur.

1. https://entra.microsoft.com → **Applications → Inscriptions d'applications → Nouvelle inscription**
   Nom : `GEO-Light auto` · Comptes de cet annuaire uniquement · pas d'URI de redirection → **S'inscrire**.
2. Noter l'**ID d'application (client)** et l'**ID de l'annuaire (locataire)**.
3. **Certificats et secrets → Nouveau secret client** · durée 24 mois → copier la **Valeur** tout de suite
   (elle n'est plus visible ensuite). Mettre un rappel dans le calendrier avant l'expiration.
4. Donner l'accès à la seule boîte custom-software@ (Exchange Online PowerShell, en admin) :
   ```powershell
   Install-Module ExchangeOnlineManagement   # une seule fois
   Connect-ExchangeOnline
   # ObjectId = Entra → Applications d'entreprise → GEO-Light auto → « ID d'objet »
   New-ServicePrincipal -AppId <ID client> -ObjectId <ID d'objet> -DisplayName "GEO-Light auto"
   New-ManagementScope -Name "GEO-Light boite" -RecipientRestrictionFilter "PrimarySmtpAddress -eq 'custom-software@zbinden.online'"
   New-ManagementRoleAssignment -App <ID client> -Role "Application Mail.ReadWrite" -CustomResourceScope "GEO-Light boite"
   # Vérification (doit répondre InScope = True) :
   Test-ServicePrincipalAuthorization -Identity <ID client> -Resource custom-software@zbinden.online
   ```
   Ne **pas** ajouter de permission Mail.ReadWrite dans « Autorisations de l'API » d'Entra : elle
   ouvrirait toutes les boîtes du domaine. L'attribution Exchange ci-dessus suffit et se limite à custom-software@.

## 2. Variables Vercel (Settings → Environments → Production)

| Clé | Valeur |
|---|---|
| `GEO_RUN_SECRET` | une longue chaîne aléatoire (c'est aussi le code de la page /geo-light-start) |
| `PERPLEXITY_API_KEY` | la même que dans `C:\Users\Pauline\test\.env` |
| `ANTHROPIC_API_KEY` | clé créée sur https://console.anthropic.com (Settings → API keys), avec du crédit et une limite de dépenses mensuelle |
| `GRAPH_TENANT_ID` | ID de l'annuaire (étape 1.2) |
| `GRAPH_CLIENT_ID` | ID d'application (étape 1.2) |
| `GRAPH_CLIENT_SECRET` | Valeur du secret (étape 1.3) |

Déjà présentes : `OPENAI_API_KEY`, `RESEND_API_KEY`.
Optionnel : `GEO_LIGHT_DAILY_MAX` (défaut 5), `GEO_LIGHT_MODEL` (défaut claude-opus-5-5), `GRAPH_MAILBOX`.

Puis **Redeploy** pour que les variables soient prises en compte.

## 3. Coûts et limites

- Par test : 16 questions (ChatGPT avec recherche web + Perplexity) environ CHF 0.30, rédaction par Claude Opus 5.5 environ CHF 0.10 à 0.20.
- Au plus 5 tests automatiques par jour (comptés dans la boîte : brouillons de la catégorie « GEO-Light auto »).
  Au-delà, l'alerte dit de le faire à la main. Le lancement manuel n'est pas limité.
- Garder une limite de dépenses mensuelle sur les clés OpenAI, Perplexity et Anthropic.
- Profil saisi à la main (lecture du site impossible) : pas de test automatique, notification habituelle.

## 4. Si quelque chose échoue

L'alerte « GEO-Light automatique échoué » donne l'étape et l'erreur. Si le PDF est déjà prêt, il est joint
avec le texte de l'e-mail ; sinon : `/geo-light <url> <email>` dans Claude Code, comme avant.
