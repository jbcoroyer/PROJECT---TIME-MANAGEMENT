import PricingPageContent from "../../components/marketing/PricingPageContent";
import { TRIAL_DAYS, singlePlanPricingSummary } from "../../lib/billing/plans";

export const metadata = {
  title: "Tarifs",
  description: `Un seul abonnement : ${singlePlanPricingSummary()}, tout inclus. Essai gratuit ${TRIAL_DAYS} jours sans carte.`,
};

export default function PricingPage() {
  return <PricingPageContent />;
}
