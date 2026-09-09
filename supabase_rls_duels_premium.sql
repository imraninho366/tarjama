-- =====================================================================
-- Politiques RLS manquantes — a executer dans l'editeur SQL de Supabase
-- Constate le 9 septembre 2026, sur https://coechxxziowvygxxmekf.supabase.co
-- =====================================================================
--
-- CE QUI A ETE MESURE
-- Avec la seule cle anonyme, sans aucun compte, la table `duels` renvoyait
-- 17 lignes completes : player1_id, player1_name, player2_id, player2_name,
-- les scores et le CODE de partie. N'importe quel visiteur pouvait donc lister
-- les identifiants et pseudos des joueurs, et s'inviter dans leurs parties.
--
-- `premium_users`, `profiles`, `suggestions` et `progress` renvoyaient zero
-- ligne : leurs politiques sont deja actives. Seule `duels` etait ouverte.
--
-- POURQUOI CE FICHIER ET PAS UN CORRECTIF DANS LE CODE
-- La cle anonyme est livree au navigateur. Un controle ecrit en JavaScript
-- n'est donc pas une barriere : il cache un bouton, il n'interdit rien. La
-- seule frontiere reelle est ici, dans PostgreSQL.
--
-- PREREQUIS DEJA EN PLACE (commit accompagnant ce fichier)
-- /api/duel agit desormais au nom de l'appelant via clientDeLAppelant(), et
-- non plus en anonyme. Sans cela, les politiques ci-dessous casseraient le
-- duel en meme temps qu'elles fermeraient la fuite.

-- ---------------------------------------------------------------------
-- 1. duels — la fuite reelle
-- ---------------------------------------------------------------------
ALTER TABLE public.duels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "duels_select" ON public.duels;
DROP POLICY IF EXISTS "duels_insert" ON public.duels;
DROP POLICY IF EXISTS "duels_update" ON public.duels;

-- Lecture : ses propres parties, plus celles qui attendent un adversaire.
-- Cette derniere clause est indispensable : pour rejoindre par code, il faut
-- pouvoir lire une partie dont on n'est pas encore participant.
CREATE POLICY "duels_select" ON public.duels
  FOR SELECT TO authenticated
  USING (
    player1_id = auth.uid()
    OR player2_id = auth.uid()
    OR status = 'waiting'
  );

-- Creation : on ne peut ouvrir une partie qu'en son propre nom.
CREATE POLICY "duels_insert" ON public.duels
  FOR INSERT TO authenticated
  WITH CHECK (player1_id = auth.uid());

-- Mise a jour : rejoindre une partie libre, ou modifier une partie ou l'on
-- joue. USING regarde la ligne AVANT, WITH CHECK la ligne APRES — d'ou les
-- deux conditions : la premiere autorise le join, la seconde interdit de
-- s'attribuer la partie d'autrui.
CREATE POLICY "duels_update" ON public.duels
  FOR UPDATE TO authenticated
  USING (
    player1_id = auth.uid()
    OR player2_id = auth.uid()
    OR (status = 'waiting' AND player2_id IS NULL)
  )
  WITH CHECK (player1_id = auth.uid() OR player2_id = auth.uid());

-- ---------------------------------------------------------------------
-- 2. premium_users — ceinture et bretelles
-- ---------------------------------------------------------------------
-- La lecture anonyme est deja fermee. Ce qui suit ferme l'ECRITURE, que rien
-- ne protegeait cote base : grantPremium() ecrit depuis le navigateur et son
-- test isAdmin() s'execute cote client, donc contournable depuis la console.
--
-- A relativiser : le premium n'ouvre AUCUNE fonctionnalite aujourd'hui.
-- isPremium, canUseQuiz et checkPremiumServer ne sont appeles nulle part.
-- S'en accorder ne debloquerait rien. On ferme quand meme, parce que le jour
-- ou le premium servira a quelque chose, personne ne repensera a cette porte.
ALTER TABLE public.premium_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "premium_select" ON public.premium_users;
DROP POLICY IF EXISTS "premium_write_admin" ON public.premium_users;

-- Les deux identifiants viennent de ADMIN_IDS, dans lib/freemium.js.
-- Les garder synchronises : un admin ajoute la sans l'etre ici ne pourrait
-- rien faire, et l'inverse laisserait un acces oublie.
CREATE POLICY "premium_select" ON public.premium_users
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR auth.uid() IN (
      'cc0683b4-fdb3-4ddb-b157-f2669b99dee4',
      'efcffbac-7cc5-4b56-b46a-118e4e9e845f'
    )
  );

CREATE POLICY "premium_write_admin" ON public.premium_users
  FOR ALL TO authenticated
  USING (
    auth.uid() IN (
      'cc0683b4-fdb3-4ddb-b157-f2669b99dee4',
      'efcffbac-7cc5-4b56-b46a-118e4e9e845f'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      'cc0683b4-fdb3-4ddb-b157-f2669b99dee4',
      'efcffbac-7cc5-4b56-b46a-118e4e9e845f'
    )
  );

-- ---------------------------------------------------------------------
-- 3. Verification, a lancer apres coup
-- ---------------------------------------------------------------------
-- Doit lister les politiques ci-dessus :
--   SELECT tablename, policyname, cmd, roles
--   FROM pg_policies WHERE tablename IN ('duels','premium_users')
--   ORDER BY tablename, policyname;
