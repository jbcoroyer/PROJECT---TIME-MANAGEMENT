import {
  PLAN_COMPARISON_ROWS,
  type ComparisonCellValue,
  type PublicPlan,
} from "../../lib/billing/plans";

const PLAN_LABELS: Record<PublicPlan, string> = {
  free: "Gratuit",
  starter: "Starter",
  pro: "Pro",
};

function formatCell(value: ComparisonCellValue): { text: string; muted: boolean } {
  if (value === true) return { text: "✓", muted: false };
  if (value === false) return { text: "—", muted: true };
  return { text: value, muted: false };
}

export default function PricingComparisonTable() {
  return (
    <div className="mkt-comparison">
      <div className="mkt-comparison__rows">
        <div className="mkt-comparison__header">
          <span>Fonctionnalité</span>
          <span>{PLAN_LABELS.free}</span>
          <span>{PLAN_LABELS.starter}</span>
          <span>{PLAN_LABELS.pro}</span>
        </div>
        {PLAN_COMPARISON_ROWS.map((row) => {
          const free = formatCell(row.free);
          const starter = formatCell(row.starter);
          const pro = formatCell(row.pro);
          return (
            <div key={row.label} className="mkt-comparison__row">
              <span className="mkt-comparison__label">{row.label}</span>
              <span
                className={[
                  "mkt-comparison__cell",
                  free.muted ? "mkt-comparison__cell--muted" : "mkt-comparison__cell--normal",
                ].join(" ")}
              >
                {free.text}
              </span>
              <span
                className={[
                  "mkt-comparison__cell",
                  starter.muted ? "mkt-comparison__cell--muted" : "mkt-comparison__cell--starter",
                ].join(" ")}
              >
                {starter.text}
              </span>
              <span
                className={[
                  "mkt-comparison__cell",
                  pro.muted ? "mkt-comparison__cell--muted" : "mkt-comparison__cell--normal",
                ].join(" ")}
              >
                {pro.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
