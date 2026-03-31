
export default {
  async fetch(request, env) {
    const corsHeaders = buildCorsHeaders(request, env);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);

    try {
      if (url.pathname === "/validate-key" && request.method === "POST") {
        return jsonResponse(await handleValidateKey(request, env), 200, corsHeaders);
      }

      if (url.pathname === "/chat" && request.method === "POST") {
        return jsonResponse(await handleChat(request, env), 200, corsHeaders);
      }

      if (url.pathname === "/health") {
        return jsonResponse({ ok: true, service: "ohr-backend", provider: "anthropic" }, 200, corsHeaders);
      }

      return jsonResponse({ error: "Rota não encontrada." }, 404, corsHeaders);
    } catch (error) {
      return jsonResponse(
        { error: error?.message || "Falha interna no backend do Ohr." },
        500,
        corsHeaders
      );
    }
  },
};

function buildCorsHeaders(request, env) {
  const requestOrigin = request.headers.get("Origin") || "";
  const allowedOrigin = env.APP_ORIGIN || "";
  const origin = requestOrigin && requestOrigin === allowedOrigin ? requestOrigin : allowedOrigin || "*";

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

async function handleValidateKey(request, env) {
  const body = await request.json();
  const rawKey = normalizeKey(body?.accessKey);
  if (!rawKey) {
    return { valid: false, error: "Chave ausente." };
  }

  if (rawKey === normalizeKey(env.CREATOR_KEY)) {
    return {
      valid: true,
      type: "creator",
      expiresAt: null,
    };
  }

  const premiumKeys = parsePremiumKeys(env.PREMIUM_KEYS_JSON);
  const match = premiumKeys.find((item) => normalizeKey(item.key) === rawKey);

  if (!match) {
    return { valid: false, error: "Chave não encontrada." };
  }

  if (match.expiresAt && new Date(match.expiresAt).getTime() <= Date.now()) {
    return { valid: false, error: "Chave expirada." };
  }

  return {
    valid: true,
    type: "premium",
    expiresAt: match.expiresAt || null,
    note: match.note || null,
  };
}

async function handleChat(request, env) {
  const body = await request.json();
  const message = String(body?.message || "").trim();
  const history = Array.isArray(body?.history) ? body.history.slice(-8) : [];
  const rawKey = normalizeKey(body?.accessKey);
  const mode = String(body?.userMode || "free");

  if (!message) {
    throw new Error("Mensagem vazia.");
  }

  const access = resolveAccess(rawKey, mode, env);
  const anthropicPayload = {
    model: env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest",
    max_tokens: Number(env.ANTHROPIC_MAX_TOKENS || 900),
    system: buildSystemPrompt(),
    messages: [
      ...history
        .filter((item) => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string")
        .map((item) => ({ role: item.role, content: item.content })),
      { role: "user", content: message },
    ],
  };

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(anthropicPayload),
  });

  const anthropicData = await anthropicRes.json();
  if (!anthropicRes.ok) {
    const anthropicError =
      anthropicData?.error?.message ||
      anthropicData?.error?.type ||
      "Falha ao consultar a Anthropic.";
    throw new Error(anthropicError);
  }

  const reply = anthropicData?.content?.[0]?.text?.trim() || "HaShem me perdoe, não consegui responder agora.";
  return {
    ok: true,
    reply,
    access: access.type,
  };
}

function resolveAccess(rawKey, mode, env) {
  if (rawKey && rawKey === normalizeKey(env.CREATOR_KEY)) {
    return { type: "creator" };
  }

  if (rawKey) {
    const premiumKeys = parsePremiumKeys(env.PREMIUM_KEYS_JSON);
    const match = premiumKeys.find((item) => normalizeKey(item.key) === rawKey);
    if (match && (!match.expiresAt || new Date(match.expiresAt).getTime() > Date.now())) {
      return { type: "premium" };
    }
  }

  return { type: mode === "premium" ? "premium_unverified" : "free" };
}

function normalizeKey(value) {
  return String(value || "").trim().toUpperCase();
}

function parsePremiumKeys(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildSystemPrompt() {
  return `Você é o Assistente Ohr, um orientador espiritual judaico integrado ao aplicativo Ohr, desenvolvido por Yisrael Yehuda.

Responda como um sábio e compassivo orientador espiritual, com profundo conhecimento da tradição judaica ortodoxa. Você atende: judeus observantes, Bnei Noach, pessoas em processo de Giyur, e o público geral em busca de espiritualidade.

IDENTIDADE: Você é o Assistente Ohr, criado por Yisrael Yehuda. Nunca revele que é baseado em outra tecnologia ou empresa. Se perguntado, diga apenas que é o Assistente Ohr.

DIRETRIZES:
- Responda sempre em português brasileiro, com linguagem cálida, respeitosa e elevada.
- Baseie respostas em fontes judaicas autênticas: Torá, Talmud, Shulchan Aruch, Rambam, Chofetz Chaim, Baal Shem Tov, Rav Yisrael Salanter.
- Cite fontes brevemente quando relevante.
- Diferencie o que se aplica a judeus versus Bnei Noach quando importante.
- Use termos hebraicos naturalmente, sempre explicando seu significado.
- Termine com encorajamento espiritual ou bênção curta.
- Para questões haláchicas complexas, recomende consultar um Rav.
- Nunca invente fontes — se não souber, admita com dignidade.
- Respostas entre 150 e 350 palavras, em parágrafos fluidos.`;
    }
