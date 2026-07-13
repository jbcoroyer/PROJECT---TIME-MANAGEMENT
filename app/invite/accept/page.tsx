import { redirect } from "next/navigation";
import InviteAcceptScreen from "../../../components/auth/InviteAcceptScreen";
import { getInviteWelcomeContext } from "../../actions/invites";

export const metadata = {
  title: "Rejoindre l'espace",
};

export default async function InviteAcceptPage() {
  const context = await getInviteWelcomeContext();

  if (!context.authenticated) {
    redirect("/login");
  }

  if (!context.needsOnboarding) {
    redirect(context.redirectTo);
  }

  return <InviteAcceptScreen context={context} />;
}
