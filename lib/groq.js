/**
 * Groq — configuration centralisée.
 *
 * Groq décommissionne régulièrement ses modèles. Quand un modèle est retiré,
 * l'API renvoie « The model `X` does not exist or you do not have access to it. »
 * et TOUTES les fonctionnalités IA tombent d'un coup.
 *
 * → Pour migrer : changer UNIQUEMENT les constantes ci-dessous.
 * → Modèles disponibles : https://console.groq.com/docs/models
 * → Dépréciations : https://console.groq.com/docs/deprecations
 *
 * Historique :
 *   - llama-3.3-70b-versatile → accès coupé (constaté le 22 mai 2026)
 */

/** Modèle principal — qualité prioritaire (contenu religieux, corrections). */
export const GROQ_MODEL = 'openai/gpt-oss-120b'

/**
 * Modèle rapide — sorties courtes (mnémoniques, indices).
 *
 * Identique au modèle principal pour l'instant : ce compte Groq n'a accès
 * QU'AUX modèles openai/gpt-oss-*. Les modèles Llama listés dans la doc
 * publique (llama-3.3-70b-versatile, llama-3.1-8b-instant) renvoient tous
 * « does not exist or you do not have access to it » — testé le 22 mai 2026.
 *
 * Comme gpt-oss raisonne avant d'écrire, toute route qui l'utilise DOIT
 * prévoir un max_tokens confortable (≥ 400) : le raisonnement est facturé
 * sur le même budget et une sortie vide est le symptôme d'un budget trop
 * serré. callGroq() ci-dessous force reasoning_effort: 'low' pour limiter ça.
 */
export const GROQ_MODEL_FAST = 'openai/gpt-oss-120b'

/** Modèle audio — transcription. */
export const GROQ_MODEL_AUDIO = 'whisper-large-v3-turbo'

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions'

/**
 * Appelle l'API chat de Groq et renvoie toujours un résultat exploitable.
 *
 * Ne lève jamais d'exception : renvoie { ok, content, error, status } pour que
 * l'appelant décide quoi faire. L'erreur Groq réelle est toujours conservée
 * (jamais remplacée par un message générique) et loggée côté serveur — c'est
 * ce qui permet de diagnostiquer une panne en lisant les logs Vercel.
 *
 * @returns {Promise<{ok: boolean, content: string, error: string|null, status: number}>}
 */
export async function callGroq({
  prompt,
  system,
  messages,
  model = GROQ_MODEL,
  temperature = 0.3,
  maxTokens,
  json = false,
  route = 'groq',
}) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    console.error(`[${route}] GROQ_API_KEY absente de l'environnement`)
    return { ok: false, content: '', error: 'Clé Groq non configurée', status: 500 }
  }

  const body = {
    model,
    messages: messages || [
      ...(system ? [{ role: 'system', content: system }] : []),
      { role: 'user', content: prompt },
    ],
    temperature,
    ...(maxTokens ? { max_tokens: maxTokens } : {}),
    ...(json ? { response_format: { type: 'json_object' } } : {}),
    // Les modèles gpt-oss raisonnent avant d'écrire, et ce raisonnement
    // consomme max_tokens. Sans ces deux réglages : réponse vide sur les
    // petits budgets, JSON tronqué sur les gros. Groq impose par ailleurs
    // reasoning_format 'hidden' ou 'parsed' dès qu'on active le mode JSON.
    ...(model.startsWith('openai/gpt-oss')
      ? { reasoning_effort: 'low', reasoning_format: 'hidden' }
      : {}),
  }

  try {
    const response = await fetch(GROQ_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      const message = data?.error?.message || `HTTP ${response.status}`
      // Log complet : indispensable pour diagnostiquer un modèle retiré.
      console.error(`[${route}] Groq ${response.status} (model=${model}): ${message}`)
      return { ok: false, content: '', error: message, status: response.status }
    }

    const content = data.choices?.[0]?.message?.content || ''
    if (!content) {
      console.error(`[${route}] Groq a répondu 200 mais sans contenu`)
      return { ok: false, content: '', error: 'Réponse IA vide', status: 502 }
    }

    return { ok: true, content, error: null, status: 200 }
  } catch (err) {
    console.error(`[${route}] Groq fetch échoué: ${err.message}`)
    return { ok: false, content: '', error: err.message, status: 500 }
  }
}

/**
 * Comme callGroq mais force le mode JSON et parse la réponse.
 * Un JSON invalide est traité comme un échec, jamais comme un objet vide
 * silencieux — sinon l'utilisateur voit une page vide sans explication.
 *
 * @returns {Promise<{ok: boolean, data: object|null, error: string|null, status: number}>}
 */
export async function callGroqJSON(options) {
  const result = await callGroq({ ...options, json: true })
  if (!result.ok) return { ok: false, data: null, error: result.error, status: result.status }

  try {
    return { ok: true, data: JSON.parse(result.content), error: null, status: 200 }
  } catch (err) {
    console.error(`[${options.route || 'groq'}] JSON invalide: ${result.content.slice(0, 200)}`)
    return { ok: false, data: null, error: 'Réponse IA illisible', status: 502 }
  }
}
