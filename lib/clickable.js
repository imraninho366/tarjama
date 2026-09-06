/**
 * Rend un element non interactif utilisable au clavier.
 *
 * POURQUOI CE FICHIER EXISTE
 * Les listes de Tarjama — sourates, hadiths, invocations, sourates par ordre
 * de revelation — etaient des <div> portant un onClick. Ca marche a la souris
 * et au doigt, et seulement la : un <div> n'entre pas dans l'ordre de
 * tabulation, ne reagit ni a Entree ni a Espace, et un lecteur d'ecran
 * l'annonce comme du texte inerte.
 *
 * Concretement, quelqu'un qui navigue au clavier ne pouvait ouvrir AUCUNE
 * sourate, AUCUN hadith, AUCUNE invocation. Releve le 6 septembre 2026 :
 * 133 elements sur /duas, 114 sur /revelation, 98 sur /hadith.
 *
 * POURQUOI PAS UN VRAI <button>
 * C'est la solution de reference, et elle reste preferable quand elle est
 * possible — c'est ce qui a ete fait pour les croix « effacer la recherche ».
 * Mais un <button> n'herite ni de la police ni de l'alignement du texte, et
 * centre son contenu : l'appliquer aux grandes cartes obligeait a reprendre
 * douze classes CSS, avec autant d'occasions de casser la mise en page. Le
 * triplet role + tabIndex + gestion clavier ci-dessous produit exactement le
 * meme comportement percu, sans toucher a une seule regle de style.
 *
 * ECRIT UNE FOIS, PAS QUINZE : recopier ce gestionnaire sur chaque liste
 * garantirait qu'une prochaine liste l'oublie.
 *
 * @example
 *   <div {...clickable(() => openSourate(s))} className={styles.carte}>
 */
export function clickable(onActivate) {
  return {
    role: 'button',
    tabIndex: 0,
    onClick: onActivate,
    onKeyDown: (e) => {
      // Entree ET Espace : c'est ce que fait un vrai bouton, et ce que les
      // utilisateurs au clavier essaient en premier.
      if (e.key !== 'Enter' && e.key !== ' ') return
      // Sans preventDefault, Espace fait defiler la page sous l'element qu'on
      // vient d'activer.
      e.preventDefault()
      onActivate(e)
    },
  }
}
