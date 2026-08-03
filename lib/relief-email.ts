type VerificationEmail = { email: string; name: string; url: string };
type TeamInvitationEmail = {
  email: string;
  inviterName: string;
  url: string;
  workspaceName: string;
};

export function isReliefEmailReady() {
  return Boolean(
    process.env.RESEND_API_KEY?.trim().startsWith("re_") &&
      process.env.RELIEF_EMAIL_FROM?.trim(),
  );
}

export async function sendVerificationEmail(input: VerificationEmail) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RELIEF_EMAIL_FROM?.trim();
  if (!apiKey || !from) return { delivered: false as const };
  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from,
      html: `<main style="background:#030814;color:#f8fbff;font-family:Arial,sans-serif;padding:40px"><section style="max-width:540px;margin:auto;background:#09162b;border:1px solid #243a5e;border-radius:22px;padding:36px"><p style="color:#78aefd;letter-spacing:.12em;font-size:11px;font-weight:700">RELIEF VISIBILITY OS</p><h1 style="font-size:30px;line-height:1.1">Confirmez votre adresse e-mail.</h1><p style="color:#c3d0e4;line-height:1.6">Bonjour ${escapeHtml(input.name)}, votre espace est prêt à être configuré. Confirmez votre adresse pour lancer votre premier diagnostic.</p><p style="margin:30px 0"><a href="${input.url}" style="display:inline-block;background:#176df5;border-radius:10px;color:white;padding:15px 22px;text-decoration:none;font-weight:700">Confirmer mon adresse</a></p><p style="color:#7e93b3;font-size:13px;line-height:1.5">Ce lien est personnel et valable 24 heures. Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer cet e-mail.</p></section></main>`,
      subject: "Confirmez votre accès à Relief Visibility OS",
      to: [input.email],
    }),
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    method: "POST",
  });
  return { delivered: response.ok as boolean };
}

export async function sendTeamInvitationEmail(input: TeamInvitationEmail) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RELIEF_EMAIL_FROM?.trim();
  if (!apiKey || !from) return { delivered: false as const };
  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from,
      html: `<main style="background:#030814;color:#f8fbff;font-family:Arial,sans-serif;padding:40px"><section style="max-width:540px;margin:auto;background:#09162b;border:1px solid #243a5e;border-radius:22px;padding:36px"><p style="color:#78aefd;letter-spacing:.12em;font-size:11px;font-weight:700">RELIEF VISIBILITY OS</p><h1 style="font-size:30px;line-height:1.1">Rejoignez ${escapeHtml(input.workspaceName)}.</h1><p style="color:#c3d0e4;line-height:1.6">${escapeHtml(input.inviterName)} vous invite à collaborer dans son espace Relief Visibility OS.</p><p style="margin:30px 0"><a href="${input.url}" style="display:inline-block;background:#176df5;border-radius:10px;color:white;padding:15px 22px;text-decoration:none;font-weight:700">Rejoindre l’espace</a></p><p style="color:#7e93b3;font-size:13px;line-height:1.5">Cette invitation est personnelle et valable 7 jours.</p></section></main>`,
      subject: `${input.inviterName} vous invite sur Relief Visibility OS`,
      to: [input.email],
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  return { delivered: response.ok as boolean };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
}
