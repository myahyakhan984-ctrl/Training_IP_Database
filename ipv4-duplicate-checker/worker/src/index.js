function getCorsHeaders(request, env) {
  const requestOrigin = request.headers.get("Origin") || "";
  const configuredOrigin = (env.ALLOWED_ORIGIN || "*").trim();

  let allowOrigin = "*";
  if (configuredOrigin !== "*") {
    // Only echo the configured origin when it matches the request.
    allowOrigin = requestOrigin === configuredOrigin ? configuredOrigin : configuredOrigin;
  }

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers });
}

function isValidIPv4(value) {
  if (typeof value !== "string") return false;

  const ip = value.trim();
  const parts = ip.split(".");
  if (parts.length !== 4) return false;

  return parts.every((part) => {
    // Decimal octets only; no signs, spaces, or empty sections.
    if (!/^\d{1,3}$/.test(part)) return false;
    const number = Number(part);
    return number >= 0 && number <= 255;
  });
}

function normalizeInput(value) {
  return String(value ?? "").trim();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = getCorsHeaders(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    try {
      if (url.pathname === "/api/health" && request.method === "GET") {
        return json({ success: true, message: "IPv4 API is running" }, 200, headers);
      }

      if (url.pathname === "/api/upload-ips" && request.method === "POST") {
        return await handleUpload(request, env, headers);
      }

      if (url.pathname === "/api/ips" && request.method === "GET") {
        return await handleGetIPs(url, env, headers);
      }

      if (url.pathname === "/api/stats" && request.method === "GET") {
        return await handleStats(env, headers);
      }

      return json({
        success: false,
        message: "Endpoint not found"
      }, 404, headers);
    } catch (error) {
      console.error("Worker error:", error);
      return json({
        success: false,
        message: "Server error. Check Cloudflare Worker logs."
      }, 500, headers);
    }
  }
};

async function handleUpload(request, env, headers) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, message: "Request body must be valid JSON." }, 400, headers);
  }

  const rawList = Array.isArray(body.ips)
    ? body.ips
    : (body.ip_address !== undefined ? [body.ip_address] : []);

  if (rawList.length === 0) {
    return json({
      success: false,
      message: "Paste at least one IPv4 address."
    }, 400, headers);
  }

  if (rawList.length > 500) {
    return json({
      success: false,
      message: "Maximum 500 IP addresses are allowed per upload."
    }, 400, headers);
  }

  const inserted = [];
  const duplicates = [];
  const invalid = [];
  const statements = [];
  const validInOrder = [];

  for (const raw of rawList) {
    const ip = normalizeInput(raw);

    if (!isValidIPv4(ip)) {
      invalid.push(ip || "(empty line)");
      continue;
    }

    validInOrder.push(ip);
    statements.push(
      env.DB.prepare(
        "INSERT OR IGNORE INTO ip_records (ip_address) VALUES (?1)"
      ).bind(ip)
    );
  }

  if (statements.length > 0) {
    // D1 batch runs the prepared statements as a transaction.
    const results = await env.DB.batch(statements);

    results.forEach((result, index) => {
      const ip = validInOrder[index];
      const changes = result?.meta?.changes ?? 0;
      if (changes > 0) {
        inserted.push(ip);
      } else {
        duplicates.push(ip);
      }
    });
  }

  return json({
    success: true,
    message: "Upload processing completed.",
    summary: {
      received: rawList.length,
      uploaded: inserted.length,
      duplicates: duplicates.length,
      invalid: invalid.length
    },
    uploaded_ips: inserted,
    duplicate_ips: duplicates,
    invalid_ips: invalid
  }, 200, headers);
}

async function handleGetIPs(url, env, headers) {
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const perPage = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get("per_page") || "20", 10) || 20));
  const search = (url.searchParams.get("search") || "").trim();
  const offset = (page - 1) * perPage;

  let count;
  let result;

  if (search) {
    const term = `%${search}%`;
    count = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM ip_records WHERE ip_address LIKE ?1"
    ).bind(term).first();

    result = await env.DB.prepare(
      "SELECT id, ip_address, created_at FROM ip_records WHERE ip_address LIKE ?1 ORDER BY id DESC LIMIT ?2 OFFSET ?3"
    ).bind(term, perPage, offset).all();
  } else {
    count = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM ip_records"
    ).first();

    result = await env.DB.prepare(
      "SELECT id, ip_address, created_at FROM ip_records ORDER BY id DESC LIMIT ?1 OFFSET ?2"
    ).bind(perPage, offset).all();
  }

  const total = count?.count || 0;
  return json({
    success: true,
    records: result.results || [],
    pagination: {
      page,
      per_page: perPage,
      total,
      total_pages: Math.ceil(total / perPage)
    }
  }, 200, headers);
}

async function handleStats(env, headers) {
  const result = await env.DB.prepare(
    "SELECT COUNT(*) AS total_ips FROM ip_records"
  ).first();

  return json({
    success: true,
    total_ips: result?.total_ips || 0
  }, 200, headers);
}
