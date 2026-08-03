import {
  allowAuthLinkRequest,
  createWorkspaceInvitation,
  getCommercialEntitlement,
  getWorkspaceMembership,
  listWorkspaceMembers,
} from "../../../../db/commercial";
import {
  authRedirect,
  isAllowedAuthOrigin,
  privateJson,
  readAuthJson,
  requestIp,
} from "../../../../lib/auth-request";
import {
  isReliefEmailReady,
  sendTeamInvitationEmail,
} from "../../../../lib/relief-email";
import { getChatGPTUser } from "../../../chatgpt-auth";

const ROLES = new Set(["admin", "analyst", "viewer"]);

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) {
    return privateJson({ error: "Authentification requise." }, { status: 401 });
  }
  if (!isAllowedAuthOrigin(request)) {
    return privateJson({ error: "Origine non autorisée." }, { status: 403 });
  }
  if (!isReliefEmailReady()) {
    return privateJson(
      { error: "Les invitations par e-mail sont en cours d’activation." },
      { status: 503 },
    );
  }
  try {
    const body = await readAuthJson(request);
    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase().slice(0, 180)
        : "";
    const role =
      typeof body.role === "string" ? body.role.trim().slice(0, 20) : "";
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !ROLES.has(role) ||
      email === user.email
    ) {
      return privateJson(
        { error: "Vérifiez l’adresse et le rôle du membre." },
        { status: 400 },
      );
    }
    const entitlement = await getCommercialEntitlement(user.email);
    if (!entitlement?.workspaceId || !entitlement.access) {
      return privateJson(
        { error: "Votre accès ne permet pas d’inviter un membre." },
        { status: 403 },
      );
    }
    const membership = await getWorkspaceMembership(
      user.email,
      entitlement.workspaceId,
    );
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return privateJson(
        { error: "Seul un propriétaire ou un administrateur peut inviter." },
        { status: 403 },
      );
    }
    const members = await listWorkspaceMembers(entitlement.workspaceId);
    if (members.some((member) => member.email === email)) {
      return privateJson(
        { error: "Cette personne appartient déjà à votre espace ou a une invitation en attente." },
        { status: 409 },
      );
    }
    if (members.length >= entitlement.limits.seats) {
      return privateJson(
        { error: "La limite de membres de votre formule est atteinte." },
        { status: 409 },
      );
    }
    const rateSecret = process.env.TRIAL_RATE_LIMIT_SECRET?.trim() ?? "";
    if (rateSecret.length < 32) {
      return privateJson(
        { error: "La protection des invitations est en cours d’activation." },
        { status: 503 },
      );
    }
    const allowed = await allowAuthLinkRequest({
      cooldownSeconds: 10,
      identifier: `team:${entitlement.workspaceId}:${requestIp(request)}`,
      limit: 15,
      secret: rateSecret,
    });
    if (!allowed) {
      return privateJson(
        { error: "Attendez un instant avant une nouvelle invitation." },
        { status: 429 },
      );
    }
    const token = await createWorkspaceInvitation({
      email,
      invitedBy: user.email,
      role: role as "admin" | "analyst" | "viewer",
      workspaceId: entitlement.workspaceId,
    });
    const delivery = await sendTeamInvitationEmail({
      email,
      inviterName: user.displayName,
      url: authRedirect(`/invitation?token=${encodeURIComponent(token)}`),
      workspaceName: entitlement.companyName,
    });
    if (!delivery.delivered) {
      return privateJson(
        { error: "L’invitation a été préparée, mais l’e-mail n’a pas pu être remis." },
        { status: 502 },
      );
    }
    return privateJson({
      message: `Invitation envoyée à ${email}.`,
      ok: true,
    });
  } catch {
    return privateJson(
      { error: "L’invitation n’a pas pu être envoyée." },
      { status: 500 },
    );
  }
}
