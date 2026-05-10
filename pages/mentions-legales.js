import Head from 'next/head'
import Link from 'next/link'
import { G } from '../lib/theme'

export default function MentionsLegales() {
  const section = (title, content) => (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 16, color: G.gold, fontFamily: 'var(--font-display)', marginBottom: 8 }}>{title}</h2>
      <div style={{ fontSize: 13, color: G.textDim, lineHeight: 1.8 }}>{content}</div>
    </div>
  )

  return (
    <>
      <Head><title>Mentions légales — Tarjama</title></Head>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 20px 64px' }}>
        <Link href="/" style={{ fontSize: 12, color: G.textMuted, textDecoration: 'none' }}>← Retour</Link>
        <h1 style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: G.text, margin: '16px 0 24px' }}>
          Mentions légales & Politique de confidentialité
        </h1>

        {section('Éditeur', 'Tarjama est un projet éducatif indépendant dédié à l\'apprentissage du vocabulaire coranique en langue française. Contact : tarjama.app')}

        {section('Hébergement', 'L\'application est hébergée par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis. La base de données est hébergée par Supabase Inc., région Europe de l\'Ouest (Paris).')}

        {section('Données collectées', 'Tarjama collecte les données suivantes lors de l\'inscription : nom d\'utilisateur (pseudonyme libre), mot de passe (chiffré par Supabase Auth). Aucune adresse email réelle n\'est collectée — l\'application utilise des identifiants internes (@tarjama.app). Les données de progression (versets traduits, scores, quiz) sont stockées pour permettre le suivi de l\'apprentissage.')}

        {section('Utilisation des données', 'Les données sont utilisées exclusivement pour le fonctionnement de l\'application : authentification, sauvegarde de progression, classement entre utilisateurs. Aucune donnée n\'est vendue, partagée avec des tiers, ni utilisée à des fins publicitaires.')}

        {section('Cookies', 'Tarjama utilise uniquement des cookies techniques nécessaires au fonctionnement (session d\'authentification Supabase). Vercel Analytics collecte des données anonymisées de fréquentation (pages vues, pays) sans cookies tiers.')}

        {section('Intelligence artificielle', 'L\'application utilise l\'API Groq (modèle Llama 3.3) pour la vérification des traductions, les indices, le tafsir et l\'analyse du vocabulaire. Les textes envoyés à l\'API sont les versets coraniques (texte public) et les traductions utilisateur. Aucune donnée personnelle n\'est transmise à Groq.')}

        {section('Droits', 'Conformément au RGPD, vous disposez d\'un droit d\'accès, de rectification et de suppression de vos données. Pour exercer ces droits, contactez-nous via l\'application. La suppression du compte entraîne la suppression de toutes les données associées.')}

        {section('Propriété intellectuelle', 'Le texte coranique est dans le domaine public. Les traductions de référence sont générées par intelligence artificielle. Le code source de l\'application est la propriété de l\'éditeur.')}

        <div style={{ fontSize: 11, color: G.textMuted, marginTop: 32, borderTop: '1px solid rgba(201,168,76,.08)', paddingTop: 16 }}>
          Dernière mise à jour : mai 2026
        </div>
      </div>
    </>
  )
}
