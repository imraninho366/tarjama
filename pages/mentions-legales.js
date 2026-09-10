import Head from 'next/head'
import Link from 'next/link'
import { G } from '../lib/theme'

export default function MentionsLegales() {
  const section = (title, content) => (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 16, color: 'var(--tarjama-color-primary)', fontFamily: 'var(--font-display)', marginBottom: 8 }}>{title}</h2>
      <div style={{ fontSize: 13, color: 'var(--tarjama-color-text-secondary)', lineHeight: 1.8 }}>{content}</div>
    </div>
  )

  return (
    <>
      <Head><title>Mentions légales — Tarjama</title></Head>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 20px 64px' }}>
        <Link href="/" style={{ fontSize: 12, color: 'var(--tarjama-color-text-muted)', textDecoration: 'none' }}>← Retour</Link>
        <h1 style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: 'var(--tarjama-color-text)', margin: '16px 0 24px' }}>
          Mentions légales & Politique de confidentialité
        </h1>

        {section('Éditeur', 'Tarjama est un projet éducatif indépendant dédié à l\'apprentissage du vocabulaire coranique en langue française. Contact : tarjama.app')}

        {section('Hébergement', 'L\'application est hébergée par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis. La base de données est hébergée par Supabase Inc., région Europe de l\'Ouest (Paris).')}

        {section('Données collectées', 'Inscription par email : nom d\'utilisateur (pseudonyme libre), adresse email — utilisée pour la connexion et la réinitialisation du mot de passe — et mot de passe chiffré par Supabase Auth. Les comptes les plus anciens utilisent un identifiant interne (@tarjama.app) à la place d\'une adresse réelle. Inscription par Google : Google transmet à Supabase l\'adresse email du compte, qui est conservée. Dans les deux cas, les données de progression (versets traduits, scores, quiz) sont stockées pour permettre le suivi de l\'apprentissage.')}

        {section('Utilisation des données', 'Les données sont utilisées exclusivement pour le fonctionnement de l\'application : authentification, sauvegarde de progression, et duels entre utilisateurs. Aucune donnée n\'est vendue, partagée avec des tiers, ni utilisée à des fins publicitaires.')}

        {section('Cookies', 'Tarjama utilise uniquement des cookies techniques nécessaires au fonctionnement (session d\'authentification Supabase). Vercel Analytics collecte des données anonymisées de fréquentation (pages vues, pays) sans cookies tiers.')}

        {section('Intelligence artificielle', 'L\'application fait appel à des services d\'intelligence artificielle pour la vérification des traductions, les indices, le tafsir et l\'analyse du vocabulaire. Plusieurs fournisseurs sont sollicités tour à tour selon leur disponibilité : Groq, Google (Gemini), Cohere, Cerebras et OpenRouter. Les textes transmis sont les versets coraniques (texte public) et la traduction que vous avez saisie. Ni votre nom d\'utilisateur, ni votre adresse email, ni votre identifiant de compte ne leur sont transmis.')}

        {section('Droits', 'Conformément au RGPD, vous disposez d\'un droit d\'accès, de rectification et de suppression de vos données. Votre nom d\'utilisateur et votre couleur se modifient depuis votre profil. Pour demander la suppression de vos données, écrivez-nous depuis la page Suggestions de l\'application : la demande est traitée manuellement et efface la progression, le vocabulaire, les duels et le profil associés au compte.')}

        {section('Propriété intellectuelle', 'Le texte coranique arabe est dans le domaine public. Les traductions de référence affichées sont celles de Muhammad Hamidullah ; les explications, indices et corrections sont générés par intelligence artificielle. Le code source de l\'application est la propriété de l\'éditeur.')}

        <div style={{ fontSize: 11, color: 'var(--tarjama-color-text-muted)', marginTop: 32, borderTop: '1px solid rgba(var(--tarjama-color-primary-rgb),.08)', paddingTop: 16 }}>
          Dernière mise à jour : septembre 2026
        </div>
      </div>
    </>
  )
}
