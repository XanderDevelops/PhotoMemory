import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "Photo Memory <photomemory@quotecel.com>";
const PUBLIC_SITE_URL = Deno.env.get("PUBLIC_SITE_URL") || "https://photographicmemory.vercel.app";

const DAILY_BUCKET = Deno.env.get("DAILY_CHALLENGE_BUCKET") || "daily-challenge";
const CONTEXTUAL_BUCKET = Deno.env.get("CONTEXTUAL_MEMORY_BUCKET") || "contextual-memory-images";
const SAFE_PROFILE_COLUMNS = [
  "id",
  "username",
  "is_pro",
  "current_streak",
  "longest_streak",
  "created_at",
  "role",
  "is_blocked",
  "blocked_at",
  "numbers_easy_hs",
  "numbers_medium_hs",
  "numbers_hard_hs",
  "numbers_guessing_hs",
  "colors_hs_0",
  "colors_hs_1",
  "colors_hs_2",
  "colors_hs_3",
  "words_hs_0",
  "words_hs_1",
  "words_hs_2",
  "people_hs_0",
  "people_hs_1",
  "people_hs_2",
  "highscore_0",
  "highscore_1",
  "highscore_2",
  "highscore_3",
  "highscore_4",
  "highscore_5",
  "lbs_highscore",
  "party_mode_score",
].join(",");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function response(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function cleanErrorMessage(message: string) {
  return message.length > 1800 ? `${message.slice(0, 1800)}...` : message;
}

function badRequest(message: string, status = 400, details: Record<string, unknown> = {}) {
  return response({ error: cleanErrorMessage(message), ...details }, status);
}

function safeName(name = "upload.png") {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "upload.png";
}

function decodeDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data.");
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return {
    contentType: match[1],
    bytes,
  };
}

async function requireAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) throw new Error("Missing user token.");

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(jwt);
  if (userError || !userData.user) throw new Error("Invalid user token.");

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("user_profiles")
    .select("id, username, role, is_blocked")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profile) throw new Error("Admin profile not found.");
  if (profile.role !== "admin" || profile.is_blocked) throw new Error("Admin access required.");

  return { user: userData.user, profile };
}

async function audit(actorId: string, action: string, details: Record<string, unknown>, targetUserId?: string) {
  const { error } = await supabaseAdmin.from("admin_audit_logs").insert({
    actor_id: actorId,
    target_user_id: targetUserId || null,
    action,
    details,
  });

  if (error) {
    console.error("admin_audit_logs insert failed", {
      action,
      actorId,
      targetUserId,
      message: error.message,
    });
  }
}

function wrapEmailHtml(subject: string, html: string) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body style="margin:0;background:#fff8e8;color:#191816;font-family:Inter,Arial,sans-serif;-webkit-text-size-adjust:100%;text-size-adjust:100%;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#fff8e8;border-collapse:collapse;table-layout:fixed;">
      <tr>
        <td align="center" style="padding:32px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:640px;background:#fffdf6;border:4px solid #1d1a17;border-radius:8px;box-shadow:6px 6px 0 #1d1a17;border-collapse:separate;box-sizing:border-box;table-layout:fixed;">
            <tr>
              <td style="padding:34px;box-sizing:border-box;overflow-wrap:break-word;word-break:normal;">
                <p style="margin:0 0 8px;color:#1f6f78;font-size:12px;font-weight:800;text-transform:uppercase;">Photo Memory</p>
                <h1 style="margin:0 0 22px;font-size:28px;line-height:1.15;overflow-wrap:break-word;">${subject}</h1>
                <div style="font-size:16px;line-height:1.6;overflow-wrap:break-word;">${html}</div>
                <p style="margin:34px 0 0;color:#706a60;font-size:13px;">Xander Develops - Photo Memory</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function actionEmailContent(linkType: "verification" | "recovery", actionLink: string) {
  if (linkType === "recovery") {
    return {
      subject: "Reset your Photo Memory password",
      html: `<p>Use the button below to reset your password.</p><p><a href="${actionLink}" style="display:inline-block;background:#f6a21a;color:#191816;border:3px solid #1d1a17;border-radius:999px;padding:12px 18px;text-decoration:none;font-weight:800;">Reset password</a></p>`,
    };
  }

  return {
    subject: "Complete your Photo Memory account",
    html: `<p>Your Photo Memory account is waiting. Use the button below to finish verifying your email and start training.</p><p><a href="${actionLink}" style="display:inline-block;background:#f6a21a;color:#191816;border:3px solid #1d1a17;border-radius:999px;padding:12px 18px;text-decoration:none;font-weight:800;">Activate account</a></p><p style="color:#706a60;">If this was not you, you can ignore this email.</p>`,
  };
}

function previewActionEmail(linkType: "verification" | "recovery") {
  const previewLink = `${PUBLIC_SITE_URL.replace(/\/$/, "")}/verify.html?preview=true`;
  const content = actionEmailContent(linkType, previewLink);
  return {
    subject: content.subject,
    bodyHtml: content.html,
    html: wrapEmailHtml(content.subject, content.html),
  };
}

async function sendViaResend(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }
  if (!RESEND_FROM_EMAIL) {
    throw new Error("RESEND_FROM_EMAIL is not configured.");
  }

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
      html: wrapEmailHtml(subject, html),
    }),
  });

  const body = await res.json().catch(async () => ({ error: await res.text() }));
  if (!res.ok) {
    throw new Error(body?.message || body?.error || "Resend request failed.");
  }

  return body?.id || null;
}

async function logEmail(params: {
  recipientUserId?: string;
  recipientEmail: string;
  subject: string;
  emailType: string;
  sentBy: string;
  status: string;
  providerId?: string | null;
  error?: string | null;
}) {
  const { error } = await supabaseAdmin.from("admin_email_logs").insert({
    recipient_user_id: params.recipientUserId || null,
    recipient_email: params.recipientEmail,
    subject: params.subject,
    email_type: params.emailType,
    sent_by: params.sentBy,
    status: params.status,
    provider_id: params.providerId || null,
    error: params.error || null,
  });

  if (error) {
    console.error("admin_email_logs insert failed", {
      emailType: params.emailType,
      recipientUserId: params.recipientUserId,
      recipientEmail: params.recipientEmail,
      status: params.status,
      message: error.message,
    });
  }
}

async function uploadImage(bucket: string, folder: string, upload: { name: string; type?: string; dataUrl: string } | null) {
  if (!upload?.dataUrl) return null;

  const decoded = decodeDataUrl(upload.dataUrl);
  const filePath = `${folder}/${Date.now()}-${safeName(upload.name)}`;
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, decoded.bytes, {
      contentType: upload.type || decoded.contentType,
      upsert: true,
    });

  if (error) throw new Error(`Image upload failed: ${error.message}`);
  return filePath;
}

function publicImageUrl(bucket: string, path?: string | null) {
  if (!path) return null;
  return supabaseAdmin.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

async function getAuthUserById(userId: string) {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error || !data.user) throw new Error("User not found.");
  return data.user;
}

async function listUsers(adminId: string) {
  const authUsers: any[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(error.message);
    authUsers.push(...(data.users || []));
    if (!data.users || data.users.length < 1000) break;
    page += 1;
  }

  const { data: profiles, error: profileError } = await supabaseAdmin
    .from("user_profiles")
    .select(SAFE_PROFILE_COLUMNS);
  if (profileError) throw new Error(profileError.message);

  const { data: logs, error: logError } = await supabaseAdmin
    .from("admin_email_logs")
    .select("recipient_user_id,status");
  if (logError) {
    console.error("admin_email_logs select failed", {
      action: "listUsers",
      message: logError.message,
    });
  }

  const emailCounts = new Map<string, number>();
  for (const log of logError ? [] : logs || []) {
    if (!log.recipient_user_id || log.status !== "sent") continue;
    emailCounts.set(log.recipient_user_id, (emailCounts.get(log.recipient_user_id) || 0) + 1);
  }

  const profilesById = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const users = authUsers.map((authUser) => {
    const profile = profilesById.get(authUser.id) || {};
    return {
      ...profile,
      id: authUser.id,
      email: authUser.email,
      created_at: profile.created_at || authUser.created_at,
      email_confirmed_at: authUser.email_confirmed_at,
      last_sign_in_at: authUser.last_sign_in_at,
      banned_until: authUser.banned_until,
      role: profile.role || "user",
      email_sent_count: emailCounts.get(authUser.id) || 0,
    };
  }).sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));

  const currentProfile = profilesById.get(adminId) || null;
  return {
    users,
    currentProfile,
  };
}

async function setRole(actorId: string, userId: string, role: string) {
  if (!["user", "admin"].includes(role)) throw new Error("Invalid role.");
  const { error } = await supabaseAdmin.from("user_profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);
  await audit(actorId, "set_role", { role }, userId);
  return { ok: true };
}

async function setBlocked(actorId: string, userId: string, blocked: boolean) {
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    ban_duration: blocked ? "876000h" : "none",
  });
  if (authError) throw new Error(authError.message);

  const { error: profileError } = await supabaseAdmin
    .from("user_profiles")
    .update({
      is_blocked: blocked,
      blocked_at: blocked ? new Date().toISOString() : null,
    })
    .eq("id", userId);
  if (profileError) throw new Error(profileError.message);

  await audit(actorId, blocked ? "block_user" : "unblock_user", {}, userId);
  return { ok: true };
}

async function sendCustomEmail(actorId: string, userId: string, subject: string, html: string, emailType = "custom") {
  if (!subject || !html) throw new Error("Subject and message are required.");
  const authUser = await getAuthUserById(userId);
  if (!authUser.email) throw new Error("User has no email address.");

  try {
    const providerId = await sendViaResend(authUser.email, subject, html);
    await logEmail({
      recipientUserId: userId,
      recipientEmail: authUser.email,
      subject,
      emailType,
      sentBy: actorId,
      status: "sent",
      providerId,
    });
    await audit(actorId, "send_email", { subject, emailType }, userId);
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await logEmail({
      recipientUserId: userId,
      recipientEmail: authUser.email,
      subject,
      emailType,
      sentBy: actorId,
      status: "failed",
      error: message,
    });
    throw error;
  }
}

async function sendBulkEmail(actorId: string, userIds: string[], subject: string, html: string, emailType = "custom") {
  const uniqueUserIds = [...new Set(userIds || [])].slice(0, 500);
  let sent = 0;
  const failed: Array<{ userId: string; error: string }> = [];

  for (const userId of uniqueUserIds) {
    try {
      await sendCustomEmail(actorId, userId, subject, html, emailType);
      sent += 1;
    } catch (error) {
      failed.push({ userId, error: error instanceof Error ? error.message : String(error) });
    }
  }

  await audit(actorId, "send_bulk_email", { sent, failed: failed.length, emailType });
  return { ok: true, sent, failed };
}

async function sendActionLink(actorId: string, userId: string, linkType: "verification" | "recovery") {
  const authUser = await getAuthUserById(userId);
  if (!authUser.email) throw new Error("User has no email address.");

  const redirectTo = `${PUBLIC_SITE_URL.replace(/\/$/, "")}/verify.html`;
  const type = linkType === "recovery" ? "recovery" : "signup";
  let { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type,
    email: authUser.email,
    options: { redirectTo },
  });

  if (error && linkType === "verification") {
    const fallback = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: authUser.email,
      options: { redirectTo },
    });
    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data?.properties?.action_link) {
    throw new Error(error?.message || "Could not generate action link.");
  }

  const actionLink = data.properties.action_link;
  const { subject, html } = actionEmailContent(linkType, actionLink);

  await sendCustomEmail(actorId, userId, subject, html, linkType);
  await audit(actorId, `send_${linkType}_link`, {}, userId);
  return { ok: true };
}

async function sendUnverifiedVerificationEmails(actorId: string, userIds?: string[]) {
  const targetedIds = userIds?.length ? new Set(userIds) : null;
  const authUsers: any[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(error.message);
    authUsers.push(...(data.users || []));
    if (!data.users || data.users.length < 1000) break;
    page += 1;
  }

  const unverifiedUsers = authUsers
    .filter((authUser) => authUser.email && !authUser.email_confirmed_at)
    .filter((authUser) => !targetedIds || targetedIds.has(authUser.id));

  let sent = 0;
  const failed: Array<{ userId: string; error: string }> = [];

  for (const authUser of unverifiedUsers) {
    try {
      await sendActionLink(actorId, authUser.id, "verification");
      sent += 1;
    } catch (error) {
      failed.push({
        userId: authUser.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await audit(actorId, "send_unverified_verification_emails", { sent, failed: failed.length, targeted: Boolean(targetedIds) });
  return { ok: true, sent, failed };
}

async function createNotification(actorId: string, title: string, body: string, href: string, userIds: string[], audience: string) {
  if (!title || !body) throw new Error("Title and message are required.");

  const rows = userIds?.length
    ? [...new Set(userIds)].map((userId) => ({
      user_id: userId,
      title,
      body,
      href: href || null,
      audience: { type: audience },
      created_by: actorId,
    }))
    : [{
      user_id: null,
      title,
      body,
      href: href || null,
      audience: { type: audience || "all" },
      created_by: actorId,
    }];

  const { error } = await supabaseAdmin.from("notifications").insert(rows);
  if (error) throw new Error(error.message);
  await audit(actorId, "create_notification", { count: rows.length, audience });
  return { ok: true, count: rows.length };
}

async function listDailyChallenges() {
  const { data, error } = await supabaseAdmin
    .from("daily_challenges")
    .select("id, challenge_date, image_path, created_at")
    .order("challenge_date", { ascending: false })
    .limit(730);
  if (error) throw new Error(error.message);

  return {
    challenges: (data || []).map((challenge) => ({
      ...challenge,
      image_url: publicImageUrl(DAILY_BUCKET, challenge.image_path),
    })),
  };
}

async function getDailyChallenge(id: string | number) {
  if (!id) throw new Error("Challenge id is required.");

  const { data, error } = await supabaseAdmin
    .from("daily_challenges")
    .select("*, questions(*, answers(*))")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);

  return {
    challenge: {
      ...data,
      image_url: publicImageUrl(DAILY_BUCKET, data.image_path),
      questions: (data.questions || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
    },
  };
}

async function deleteDailyChallengeCascade(id: string | number) {
  const { data: questions, error: questionError } = await supabaseAdmin
    .from("questions")
    .select("id")
    .eq("challenge_id", id);
  if (questionError) throw new Error(questionError.message);

  const questionIds = (questions || []).map((question) => question.id);
  if (questionIds.length) {
    const { error: answerError } = await supabaseAdmin.from("answers").delete().in("question_id", questionIds);
    if (answerError) throw new Error(answerError.message);
  }

  const { error: deleteQuestionsError } = await supabaseAdmin.from("questions").delete().eq("challenge_id", id);
  if (deleteQuestionsError) throw new Error(deleteQuestionsError.message);

  const { error: deleteChallengeError } = await supabaseAdmin.from("daily_challenges").delete().eq("id", id);
  if (deleteChallengeError) throw new Error(deleteChallengeError.message);
}

async function saveDailyChallenge(actorId: string, challenge: Record<string, any>) {
  if (!challenge?.challenge_date) throw new Error("Challenge date is required.");

  const uploadedPath = await uploadImage(DAILY_BUCKET, "daily", challenge.imageFile || null);
  const imagePath = uploadedPath || challenge.image_path;
  if (!imagePath) throw new Error("An image is required.");

  const { data: existingChallenge } = await supabaseAdmin
    .from("daily_challenges")
    .select("id")
    .eq("challenge_date", challenge.challenge_date)
    .maybeSingle();

  const existingId = challenge.id || existingChallenge?.id || null;
  if (existingId) {
    await deleteDailyChallengeCascade(existingId);
  }

  const { data: saved, error } = await supabaseAdmin
    .from("daily_challenges")
    .insert({
      challenge_date: challenge.challenge_date,
      image_path: imagePath,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  for (const [index, question] of (challenge.questions || []).entries()) {
    const { data: savedQuestion, error: questionError } = await supabaseAdmin
      .from("questions")
      .insert({
        challenge_id: saved.id,
        question_text: question.question_text,
        order_index: question.order_index ?? index,
      })
      .select()
      .single();
    if (questionError) throw new Error(questionError.message);

    const answers = (question.answers || []).map((answer: Record<string, any>) => ({
      question_id: savedQuestion.id,
      answer_text: answer.answer_text,
      is_correct: Boolean(answer.is_correct),
    }));
    if (answers.length) {
      const { error: answerError } = await supabaseAdmin.from("answers").insert(answers);
      if (answerError) throw new Error(answerError.message);
    }
  }

  await audit(actorId, "save_daily_challenge", { challenge_date: challenge.challenge_date, id: saved.id });
  return { ok: true, id: saved.id };
}

async function listContextualLevels() {
  const { data, error } = await supabaseAdmin
    .from("levels")
    .select("*, variations(*, evidence_scenes(*, questions_cm(*, answers_cm(*))))")
    .order("level_name", { ascending: true });
  if (error) throw new Error(error.message);

  return {
    levels: (data || []).map((level) => ({
      ...level,
      variations: (level.variations || []).map((variation) => ({
        ...variation,
        evidence_scenes: (variation.evidence_scenes || []).map((scene) => ({
          ...scene,
          image_url: publicImageUrl(CONTEXTUAL_BUCKET, scene.image_path),
        })),
      })),
    })),
  };
}

async function deleteContextualLevelCascade(id: string | number) {
  const { data: variations, error: variationError } = await supabaseAdmin
    .from("variations")
    .select("id")
    .eq("level_id", id);
  if (variationError) throw new Error(variationError.message);

  const variationIds = (variations || []).map((variation) => variation.id);
  if (variationIds.length) {
    const { data: scenes, error: sceneError } = await supabaseAdmin
      .from("evidence_scenes")
      .select("id")
      .in("variation_id", variationIds);
    if (sceneError) throw new Error(sceneError.message);

    const sceneIds = (scenes || []).map((scene) => scene.id);
    if (sceneIds.length) {
      const { data: questions, error: questionError } = await supabaseAdmin
        .from("questions_cm")
        .select("id")
        .in("evidence_scene_id", sceneIds);
      if (questionError) throw new Error(questionError.message);

      const questionIds = (questions || []).map((question) => question.id);
      if (questionIds.length) {
        const { error: answerError } = await supabaseAdmin.from("answers_cm").delete().in("question_id", questionIds);
        if (answerError) throw new Error(answerError.message);
      }

      const { error: questionDeleteError } = await supabaseAdmin.from("questions_cm").delete().in("evidence_scene_id", sceneIds);
      if (questionDeleteError) throw new Error(questionDeleteError.message);

      const { error: sceneDeleteError } = await supabaseAdmin.from("evidence_scenes").delete().in("id", sceneIds);
      if (sceneDeleteError) throw new Error(sceneDeleteError.message);
    }

    const { error: variationDeleteError } = await supabaseAdmin.from("variations").delete().in("id", variationIds);
    if (variationDeleteError) throw new Error(variationDeleteError.message);
  }

  const { error: levelDeleteError } = await supabaseAdmin.from("levels").delete().eq("id", id);
  if (levelDeleteError) throw new Error(levelDeleteError.message);
}

async function saveContextualLevel(actorId: string, level: Record<string, any>) {
  if (!level?.level_name) throw new Error("Level name is required.");

  if (level.id) {
    await deleteContextualLevelCascade(level.id);
  }

  const { data: savedLevel, error: levelError } = await supabaseAdmin
    .from("levels")
    .insert({
      level_name: level.level_name,
      questions_to_ask: level.questions_to_ask || 5,
    })
    .select()
    .single();
  if (levelError) throw new Error(levelError.message);

  for (const variation of level.variations || []) {
    if (!variation.variation_name) continue;
    const { data: savedVariation, error: variationError } = await supabaseAdmin
      .from("variations")
      .insert({
        level_id: savedLevel.id,
        variation_name: variation.variation_name,
      })
      .select()
      .single();
    if (variationError) throw new Error(variationError.message);

    for (const scene of variation.evidence_scenes || []) {
      const uploadedPath = await uploadImage(CONTEXTUAL_BUCKET, "contextual", scene.imageFile || null);
      const imagePath = uploadedPath || scene.image_path;
      if (!imagePath) continue;

      const { data: savedScene, error: sceneError } = await supabaseAdmin
        .from("evidence_scenes")
        .insert({
          variation_id: savedVariation.id,
          image_path: imagePath,
        })
        .select()
        .single();
      if (sceneError) throw new Error(sceneError.message);

      for (const question of scene.questions_cm || []) {
        const { data: savedQuestion, error: questionError } = await supabaseAdmin
          .from("questions_cm")
          .insert({
            evidence_scene_id: savedScene.id,
            question_text: question.question_text,
          })
          .select()
          .single();
        if (questionError) throw new Error(questionError.message);

        const answers = (question.answers_cm || []).map((answer: Record<string, any>) => ({
          question_id: savedQuestion.id,
          answer_text: answer.answer_text,
          is_correct: Boolean(answer.is_correct),
        }));
        if (answers.length) {
          const { error: answerError } = await supabaseAdmin.from("answers_cm").insert(answers);
          if (answerError) throw new Error(answerError.message);
        }
      }
    }
  }

  await audit(actorId, "save_contextual_level", { id: savedLevel.id, level_name: level.level_name });
  return { ok: true, id: savedLevel.id };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let action = "unknown";

  try {
    const body = await req.json().catch(() => ({}));
    action = typeof body.action === "string" ? body.action : "unknown";
    const { user } = await requireAdmin(req);

    console.log("admin-api action", {
      action,
      actorId: user.id,
    });

    switch (action) {
      case "listUsers":
        return response(await listUsers(user.id));
      case "setRole":
        return response(await setRole(user.id, body.userId, body.role));
      case "setBlocked":
        return response(await setBlocked(user.id, body.userId, Boolean(body.blocked)));
      case "sendEmail":
        return response(await sendCustomEmail(user.id, body.userId, body.subject, body.html, body.emailType));
      case "sendBulkEmail":
        return response(await sendBulkEmail(user.id, body.userIds || [], body.subject, body.html, body.emailType));
      case "sendActionLink":
        return response(await sendActionLink(user.id, body.userId, body.linkType));
      case "previewVerificationEmail":
        return response(previewActionEmail("verification"));
      case "sendUnverifiedVerificationEmails":
        return response(await sendUnverifiedVerificationEmails(user.id, body.userIds || []));
      case "createNotification":
        return response(await createNotification(user.id, body.title, body.body, body.href, body.userIds || [], body.audience));
      case "listDailyChallenges":
        return response(await listDailyChallenges());
      case "getDailyChallenge":
        return response(await getDailyChallenge(body.id));
      case "saveDailyChallenge":
        return response(await saveDailyChallenge(user.id, body.challenge));
      case "deleteDailyChallenge":
        await deleteDailyChallengeCascade(body.id);
        await audit(user.id, "delete_daily_challenge", { id: body.id });
        return response({ ok: true });
      case "listContextualLevels":
        return response(await listContextualLevels());
      case "saveContextualLevel":
        return response(await saveContextualLevel(user.id, body.level));
      case "deleteContextualLevel":
        await deleteContextualLevelCascade(body.id);
        await audit(user.id, "delete_contextual_level", { id: body.id });
        return response({ ok: true });
      default:
        return badRequest("Unknown admin action.", 400, { action });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = /admin access|required|token/i.test(message) ? 403 : 400;
    console.error("admin-api action failed", {
      action,
      status,
      message,
    });
    return badRequest(message || "Admin API failed.", status, { action });
  }
});
