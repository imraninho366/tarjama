/**
 * Couche IA multi-fournisseurs avec bascule automatique.
 *
 * POURQUOI CE FICHIER EXISTE
 * Le 22 mai 2026, Groq a retiré l'accès à llama-3.3-70b-versatile sans
 * préavis : les 11 routes IA de Tarjama sont tombées d'un coup, et le vrai
 * message d'erreur était masqué par un « Erreur IA » générique. Dépendre
 * d'un fournisseur unique rend ce scénario inévitable — il se reproduira.
 *
 * PRINCIPE
 * Les fournisseurs sont essayés dans l'ordre. Si l'un échoue (modèle retiré,
 * quota dépassé, panne, clé révoquée), on passe au suivant. L'utilisateur ne
 * voit rien. L'app ne tombe que si TOUS échouent.
 *
 * Un fournisseur sans clé configurée est simplement ignoré : le code marche
 * donc avec un seul fournisseur, et gagne en robustesse à chaque clé ajoutée,
 * sans modification de code.
 *
 * AJOUTER UN FOURNISSEUR
 * Ils exposent tous une API compatible OpenAI : il suffit d'ajouter une entrée
 * dans PROVIDERS ci-dessous et de définir sa variable d'environnement.
 */

/**
 * Ordre de préférence. Le premier avec une clé configurée sert la requête.
 *
 * Mistral d'abord : quota gratuit de loin le plus large (~1 Md tokens/mois
 * contre 200 K tokens/JOUR chez Groq) et c'est une boîte française, donc bon
 * niveau en français — la langue de toute l'interface de Tarjama.
 * Groq ensuite : très rapide, déjà en place.
 * Gemini en dernier : le meilleur sur l'arabe, mais quota gratuit serré.
 */
const PROVIDERS = [
  {
    name: 'mistral',
    envKey: 'MISTRAL_API_KEY',
    url: 'https://api.mistral.ai/v1/chat/completions',
    model: 'mistral-large-latest',
    modelFast: 'mistral-small-latest',
  },
  {
    name: 'groq',
    envKey: 'GROQ_API_KEY',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'openai/gpt-oss-120b',
    modelFast: 'openai/gpt-oss-120b',
  },
  {
    name: 'gemini',
    envKey: 'GEMINI_API_KEY',
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: 'gemini-2.5-flash',
    modelFast: 'gemini-2.5-flash',
  },
]

/**
 * Budget de sortie par défaut.
 *
 * Généreux volontairement : les modèles à raisonnement (gpt-oss) dépensent
 * une partie de ce budget en réflexion interne AVANT d'écrire. Un budget trop
 * serré produit une réponse vide (constaté sur /api/mnemo à 150 tokens) ou du
 * JSON tronqué (constaté sur /api/vocab). Ne jamais descendre sous ~400.
 */
const DEFAULT_MAX_TOKENS = 800

/**
 * Extrait le message d'erreur, quel que soit le format du fournisseur.
 *
 * Ils ne s'accordent pas : OpenAI/Groq imbriquent dans { error: { message } },
 * Mistral renvoie { message } à plat, d'autres { detail }. Ne lire qu'une
 * seule forme fait tomber les autres sur un « HTTP 403 » sans explication —
 * exactement ce qui a masqué la cause du rejet de la clé Mistral.
 */
function extractError(data, status) {
  const msg =
    data?.error?.message ||
    data?.message ||
    data?.detail ||
    (typeof data?.error === 'string' ? data.error : null)

  return msg ? `${msg} (HTTP ${status})` : `HTTP ${status}`
}

/** Construit le corps de requête, en s'adaptant aux particularités du modèle. */
function buildBody({ provider, messages, temperature, maxTokens, json, fast }) {
  const model = fast ? provider.modelFast : provider.model

  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens || DEFAULT_MAX_TOKENS,
  }

  if (json) body.response_format = { type: 'json_object' }

  // Les modèles gpt-oss raisonnent avant d'écrire, et ce raisonnement est
  // facturé sur max_tokens. 'low' limite la casse ; Groq impose par ailleurs
  // reasoning_format 'hidden' ou 'parsed' dès que le mode JSON est actif.
  if (model.startsWith('openai/gpt-oss')) {
    body.reasoning_effort = 'low'
    body.reasoning_format = 'hidden'
  }

  return body
}

/**
 * Appelle le premier fournisseur disponible, en basculant sur le suivant à
 * chaque échec.
 *
 * Ne lève jamais d'exception : renvoie toujours un objet exploitable, pour que
 * l'appelant décide quoi afficher. Chaque échec est loggé avec le nom du
 * fournisseur, le modèle et le message d'erreur RÉEL — c'est ce qui permet de
 * diagnostiquer une panne en lisant les logs Vercel plutôt qu'à l'aveugle.
 *
 * @returns {Promise<{ok, content, error, status, provider}>}
 */
export async function callAI({
  prompt,
  system,
  messages,
  temperature = 0.3,
  maxTokens,
  json = false,
  fast = false,
  route = 'ai',
}) {
  const finalMessages = messages || [
    ...(system ? [{ role: 'system', content: system }] : []),
    { role: 'user', content: prompt },
  ]

  const available = PROVIDERS.filter(p => process.env[p.envKey])

  if (available.length === 0) {
    console.error(`[${route}] Aucune clé IA configurée (attendu : ${PROVIDERS.map(p => p.envKey).join(', ')})`)
    return { ok: false, content: '', error: 'Service IA non configuré', status: 500, provider: null }
  }

  const failures = []

  for (const provider of available) {
    const body = buildBody({ provider, messages: finalMessages, temperature, maxTokens, json, fast })

    try {
      const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env[provider.envKey]}`,
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        const message = extractError(data, response.status)
        console.error(`[${route}] ${provider.name} (${body.model}) a échoué ${response.status}: ${message}`)
        failures.push(`${provider.name}: ${message}`)
        continue
      }

      const content = data.choices?.[0]?.message?.content || ''

      // Une réponse 200 sans contenu est un échec, pas un succès vide : sans
      // ce garde-fou l'utilisateur voit une zone blanche sans explication.
      if (!content.trim()) {
        console.error(`[${route}] ${provider.name} (${body.model}) a renvoyé 200 mais sans contenu`)
        failures.push(`${provider.name}: réponse vide`)
        continue
      }

      // Trace du fournisseur qui a servi : indispensable pour repérer qu'on
      // tourne en permanence sur un repli sans s'en apercevoir.
      if (provider !== available[0]) {
        console.warn(`[${route}] servi par le repli « ${provider.name} »`)
      }

      return { ok: true, content, error: null, status: 200, provider: provider.name }
    } catch (err) {
      console.error(`[${route}] ${provider.name} injoignable: ${err.message}`)
      failures.push(`${provider.name}: ${err.message}`)
    }
  }

  console.error(`[${route}] TOUS les fournisseurs IA ont échoué — ${failures.join(' | ')}`)
  return {
    ok: false,
    content: '',
    error: 'Service IA temporairement indisponible',
    status: 503,
    provider: null,
  }
}

/**
 * Variante JSON : force le mode JSON et parse la réponse.
 *
 * Un JSON illisible fait basculer sur le fournisseur suivant plutôt que de
 * renvoyer un objet vide — c'est exactement le bug qu'avait /api/vocab, où du
 * JSON tronqué remontait comme une erreur opaque à l'utilisateur.
 *
 * @returns {Promise<{ok, data, error, status, provider}>}
 */
export async function callAIJSON(options) {
  const result = await callAI({ ...options, json: true })

  if (!result.ok) {
    return { ok: false, data: null, error: result.error, status: result.status, provider: result.provider }
  }

  try {
    return { ok: true, data: JSON.parse(result.content), error: null, status: 200, provider: result.provider }
  } catch (err) {
    console.error(`[${options.route || 'ai'}] JSON illisible de ${result.provider}: ${result.content.slice(0, 200)}`)
    return { ok: false, data: null, error: 'Réponse IA illisible', status: 502, provider: result.provider }
  }
}

/** Liste les fournisseurs actuellement configurés (diagnostic). */
export function configuredProviders() {
  return PROVIDERS.filter(p => process.env[p.envKey]).map(p => p.name)
}

/**
 * Teste chaque fournisseur INDÉPENDAMMENT (diagnostic).
 *
 * callAI s'arrête au premier qui répond : impossible d'en déduire l'état des
 * suivants. Cette sonde interroge chacun séparément, ce qui répond à la seule
 * question qui compte après avoir ajouté une clé — « est-ce qu'elle marche ? »
 * — sans avoir à fouiller les logs.
 *
 * @returns {Promise<Array<{name, configured, ok, model, error, ms}>>}
 */
export async function probeProviders() {
  return Promise.all(
    PROVIDERS.map(async provider => {
      if (!process.env[provider.envKey]) {
        return { name: provider.name, configured: false, ok: false, model: provider.model, error: `${provider.envKey} absente`, ms: 0 }
      }

      const started = Date.now()
      try {
        const response = await fetch(provider.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env[provider.envKey]}`,
          },
          body: JSON.stringify(buildBody({
            provider,
            messages: [{ role: 'user', content: 'Réponds exactement : OK' }],
            temperature: 0,
            maxTokens: 400,
            json: false,
            fast: false,
          })),
        })

        const data = await response.json()
        const ms = Date.now() - started

        if (!response.ok) {
          return { name: provider.name, configured: true, ok: false, model: provider.model, error: extractError(data, response.status), ms }
        }

        const content = data.choices?.[0]?.message?.content || ''
        if (!content.trim()) {
          return { name: provider.name, configured: true, ok: false, model: provider.model, error: 'réponse vide', ms }
        }

        return { name: provider.name, configured: true, ok: true, model: provider.model, error: null, ms }
      } catch (err) {
        return { name: provider.name, configured: true, ok: false, model: provider.model, error: err.message, ms: Date.now() - started }
      }
    })
  )
}
