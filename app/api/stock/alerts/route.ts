import { NextResponse } from "next/server";
import { requirePlanFeature } from "../../../../lib/server/apiAuth";
import { verifyInternalApiSecret } from "../../../../lib/server/internalApiAuth";
import { apiRateLimit } from "../../../../lib/server/rateLimit";
import { sendStockAlertWebhook } from "../../../../lib/server/sendStockAlertWebhook";

type AlertPayload = {
  itemName?: string;
  remainingQty?: number;
  alertThreshold?: number;
};

export async function POST(request: Request) {
  const limited = apiRateLimit(request, "api/stock/alerts", 20);
  if (limited) return limited;

  const isInternal = verifyInternalApiSecret(request);
  if (!isInternal) {
    const planCheck = await requirePlanFeature("slack_alerts");
    if (planCheck instanceof NextResponse) return planCheck;
  }

  try {
    const body = (await request.json()) as AlertPayload;
    const itemName = body.itemName?.trim() ?? "";
    const remainingQty = Number(body.remainingQty ?? 0);
    const alertThreshold = Number(body.alertThreshold ?? 0);

    if (!itemName || !Number.isFinite(remainingQty) || !Number.isFinite(alertThreshold)) {
      return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
    }

    if (remainingQty > alertThreshold) {
      return NextResponse.json({ triggered: false });
    }

    const result = await sendStockAlertWebhook(itemName, remainingQty);
    return NextResponse.json({ triggered: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur webhook inconnue." },
      { status: 500 },
    );
  }
}
