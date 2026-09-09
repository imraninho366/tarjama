-- Duel : questions et correction cote serveur
-- =============================================
--
-- POURQUOI CES COLONNES
--
-- Jusqu'ici, chaque navigateur fabriquait ses propres questions a partir d'une
-- graine commune, connaissait la bonne reponse des le chargement, et envoyait
-- lui-meme le score final. Deux consequences constatees le 9 septembre 2026 :
--
--   * le quiz Islam ne posait pas les memes questions aux deux joueurs (ses
--     questions viennent de l'IA, mises en cache dans une Map en memoire,
--     propre a chaque instance serverless) ;
--   * n'importe qui pouvait envoyer un score de 100 sans jouer.
--
-- Les questions sont desormais fabriquees UNE fois, a la creation du duel, et
-- rangees ici. Le serveur garde les bonnes reponses et corrige lui-meme.
--
-- Sans risque sur les duels existants : toutes les colonnes sont nullables, et
-- les parties en cours au moment de la migration gardent leur comportement.

alter table public.duels
  add column if not exists questions           jsonb,
  add column if not exists player1_answers     jsonb,
  add column if not exists player2_answers     jsonb,
  -- Le chronometre appartient au serveur : il demarre quand le joueur recoit
  -- effectivement ses questions. Un joueur ne peut donc pas se declarer plus
  -- rapide qu'il ne l'a ete.
  add column if not exists player1_started_at  timestamptz,
  add column if not exists player2_started_at  timestamptz;
