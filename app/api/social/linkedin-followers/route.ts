import { NextResponse } from "next/server";
import { requireAuth } from "../../../../lib/server/apiAuth";
import { apiRateLimit } from "../../../../lib/server/rateLimit";
import { createServerSupabase } from "../../../../lib/server/supabaseServer";

function linkedInConfig(): { url: string; slug: string } | null {
  const url = process.env.NEXT_PUBLIC_LINKEDIN_COMPANY_URL?.trim();
  if (!url) return null;
  const slugMatch = url.match(/company\/([^/?#]+)/i);
  const slug = slugMatch?.[1]?.replace(/\/$/, "");
  if (!slug) return null;
  return { url, slug };
}

type LinkedInMonthlyPoint = {
  month: string;
  followersCount: number;
  deltaFollowers: number;
  deltaPercent: number | null;
};

function parseFollowersCountFromHtml(html: string): number | null {
  const patterns = [
    /([0-9][0-9\s.,]*)\s+followers/i,
    /([0-9][0-9\s.,]*)\s+abonn(?:e|é)s/i,
    /"followerCount"\s*:\s*([0-9]+)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match?.[1]) continue;
    const digitsOnly = match[1].replace(/[^\d]/g, "");
    const followers = Number(digitsOnly);
    if (Number.isFinite(followers) && followers > 0) return followers;
  }

  return null;
}

function toMonthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthStartIso(date: Date): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

function shiftMonth(date: Date, diff: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + diff, 1));
}

export async function GET(request: Request) {
  const limited = apiRateLimit(request, "api/social/linkedin-followers", 10);
  if (limited) return limited;

  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const organizationId = auth.organizationId;

  const config = linkedInConfig();
  if (!config) {
    return NextResponse.json(
      { error: "URL LinkedIn non configurée (NEXT_PUBLIC_LINKEDIN_COMPANY_URL)." },
      { status: 503 },
    );
  }

  const { url: LINKEDIN_COMPANY_URL, slug: LINKEDIN_COMPANY_SLUG } = config;

  try {
    const response = await fetch(LINKEDIN_COMPANY_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `LinkedIn indisponible (${response.status}).` },
        { status: 502 },
      );
    }

    const html = await response.text();
    const followersCount = parseFollowersCountFromHtml(html);

    if (followersCount == null) {
      return NextResponse.json(
        { error: "Impossible d'extraire le nombre d'abonnés LinkedIn." },
        { status: 502 },
      );
    }

    let monthlySeries: LinkedInMonthlyPoint[] = [];
    let monthDelta: LinkedInMonthlyPoint | null = null;
    let historicalStatsAvailable = false;
    const viewsAvailable = false;

    try {
      const supabase = await createServerSupabase();
      const todayIso = new Date().toISOString().slice(0, 10);

      const { error: upsertError } = await supabase.from("linkedin_company_metrics").upsert(
        {
          company_slug: LINKEDIN_COMPANY_SLUG,
          source_url: LINKEDIN_COMPANY_URL,
          captured_date: todayIso,
          followers_count: followersCount,
          organization_id: organizationId,
        },
        { onConflict: "company_slug,captured_date" },
      );
      if (upsertError) throw upsertError;

      const startWindowIso = monthStartIso(shiftMonth(new Date(), -7));
      const { data: snapshots, error: snapshotsError } = await supabase
        .from("linkedin_company_metrics")
        .select("captured_date, followers_count")
        .eq("company_slug", LINKEDIN_COMPANY_SLUG)
        .eq("organization_id", organizationId)
        .gte("captured_date", startWindowIso)
        .order("captured_date", { ascending: true });
      if (snapshotsError) throw snapshotsError;

      const latestPerMonth = new Map<string, number>();
      for (const row of snapshots ?? []) {
        const key = String(row.captured_date).slice(0, 7);
        latestPerMonth.set(key, Number(row.followers_count ?? 0));
      }

      const months: string[] = [];
      const startMonth = shiftMonth(new Date(), -5);
      for (let i = 0; i < 6; i += 1) {
        months.push(toMonthKey(shiftMonth(startMonth, i)));
      }

      let prevFollowers: number | null = null;
      monthlySeries = months
        .map((month) => {
          const value = latestPerMonth.get(month);
          if (typeof value !== "number" || value <= 0) return null;
          const deltaFollowers = prevFollowers == null ? 0 : value - prevFollowers;
          const deltaPercent =
            prevFollowers == null || prevFollowers === 0 ? null : (deltaFollowers / prevFollowers) * 100;
          prevFollowers = value;
          return {
            month,
            followersCount: value,
            deltaFollowers,
            deltaPercent,
          };
        })
        .filter((item): item is LinkedInMonthlyPoint => item != null);

      monthDelta = monthlySeries.length > 0 ? monthlySeries[monthlySeries.length - 1] : null;
      historicalStatsAvailable = monthlySeries.length >= 2;
    } catch {
      historicalStatsAvailable = false;
    }

    return NextResponse.json({
      followersCount,
      sourceUrl: LINKEDIN_COMPANY_URL,
      fetchedAt: new Date().toISOString(),
      historicalStatsAvailable,
      viewsAvailable,
      monthDelta,
      monthlySeries,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur inconnue lors de la récupération LinkedIn.",
      },
      { status: 500 },
    );
  }
}
