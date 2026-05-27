import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "Photo Memory <photomemory@quotecel.com>";
const PUBLIC_SITE_URL = Deno.env.get("PUBLIC_SITE_URL") || "https://photographicmemory.vercel.app";
const ADMIN_CRON_SECRET = Deno.env.get("ADMIN_CRON_SECRET") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function assertAdminOrCron(req: Request) {
  const cronSecret = req.headers.get("x-admin-cron-secret") || "";
  if (ADMIN_CRON_SECRET && cronSecret === ADMIN_CRON_SECRET) {
    return null;
  }

  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!jwt) throw new Error("Missing admin token.");

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(jwt);
  if (userError || !userData.user) throw new Error("Invalid admin token.");

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("user_profiles")
    .select("role,is_blocked")
    .eq("id", userData.user.id)
    .single();

  if (profileError || profile?.role !== "admin" || profile?.is_blocked) {
    throw new Error("Admin access required.");
  }

  return userData.user.id;
}

function emailHtml(actionLink: string) {
  return `
    <p>Your Photo Memory account is waiting. Tap the button below to activate it and start training.</p>
    <p>
      <a href="${actionLink}" style="display:inline-block;background:#f6a21a;color:#191816;border:3px solid #1d1a17;border-radius:999px;padding:12px 18px;text-decoration:none;font-weight:800;">
        Activate my account
      </a>
    </p>
    <p style="color:#706a60;">If this was not you, you can ignore this email.</p>
  `;
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured.");
  if (!RESEND_FROM_EMAIL) throw new Error("RESEND_FROM_EMAIL is not configured.");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to,
      subject,
      html: `<!doctype html><html><body style="margin:0;background:#fff8e8;font-family:Arial,sans-serif;"><main style="max-width:620px;margin:32px auto;background:#fffdf6;border:4px solid #1d1a17;border-radius:8px;padding:34px;">${html}</main></body></html>`,
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return await res.json().catch(() => ({}));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const actorId = await assertAdminOrCron(req);
    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Number(body.limit || 100), 500);
    const dryRun = Boolean(body.dryRun);

    const users: any[] = [];
    let page = 1;
    while (users.length < limit) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error(error.message);
      users.push(...(data.users || []).filter((user) => user.email && !user.email_confirmed_at));
      if (!data.users || data.users.length < 1000) break;
      page += 1;
    }

    const selectedUsers = users.slice(0, limit);
    let sent = 0;
    const failed: Array<{ email: string; error: string }> = [];

    for (const user of selectedUsers) {
      if (dryRun) continue;

      try {
        let { data, error } = await supabaseAdmin.auth.admin.generateLink({
          type: "signup",
          email: user.email,
          options: { redirectTo: `${PUBLIC_SITE_URL.replace(/\/$/, "")}/verify.html` },
        });

        if (error) {
          const fallback = await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email: user.email,
            options: { redirectTo: `${PUBLIC_SITE_URL.replace(/\/$/, "")}/verify.html` },
          });
          data = fallback.data;
          error = fallback.error;
        }

        if (error || !data?.properties?.action_link) {
          throw new Error(error?.message || "Could not generate verification link.");
        }

        await sendEmail(user.email, "Complete your Photo Memory account", emailHtml(data.properties.action_link));
        await supabaseAdmin.from("admin_email_logs").insert({
          recipient_user_id: user.id,
          recipient_email: user.email,
          subject: "Complete your Photo Memory account",
          email_type: "verification",
          sent_by: actorId,
          status: "sent",
        });
        sent += 1;
      } catch (error) {
        failed.push({ email: user.email, error: error instanceof Error ? error.message : String(error) });
      }
    }

    return json({
      ok: true,
      dryRun,
      matched: selectedUsers.length,
      sent,
      failed,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 403);
  }
});
