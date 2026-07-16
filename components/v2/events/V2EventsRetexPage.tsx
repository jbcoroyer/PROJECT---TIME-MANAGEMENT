"use client";

import { useMemo, useState } from "react";
import { CalendarRange, Copy, Loader2, Sparkles } from "lucide-react";
import EventsSectionNav from "../../events/EventsSectionNav";
import { useEvents } from "../../../lib/useEvents";
import type { EventRow } from "../../../lib/eventTypes";
import { buildRetexDraft, useRetexInputs } from "../../../lib/v2/retex";
import { summarize } from "../../../lib/v2/aiClient";
import { toastError, toastSuccess } from "../../../lib/toast";
import { useTranslation } from "../../../lib/i18n/useTranslation";

export default function V2EventsRetexPage() {
  const { t } = useTranslation();
  const { events, loading } = useEvents();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  const selected = useMemo<EventRow | null>(
    () => events.find((e) => e.id === selectedId) ?? events[0] ?? null,
    [events, selectedId],
  );

  const { inputs, update } = useRetexInputs(selected?.id ?? null);
  const taskProgressPct = selected?.closureRecap?.taskProgressPct ?? 0;

  const retexText = useMemo(
    () =>
      selected
        ? buildRetexDraft({
            eventName: selected.name,
            location: selected.location,
            taskProgressPct,
            inputs,
          })
        : "",
    [selected, taskProgressPct, inputs],
  );

  const [aiText, setAiText] = useState<string | null>(null);

  const enrichWithAi = async () => {
    if (!selected || aiBusy) return;
    setAiBusy(true);
    try {
      const bullets = [
        t("events.ai.eventLine", {
          name: selected.name,
          location: selected.location || t("events.ai.locationFallback"),
        }),
        t("events.ai.progressLine", { pct: taskProgressPct }),
        inputs.highlights ? t("events.ai.highlightsLine", { text: inputs.highlights }) : "",
        inputs.improvements ? t("events.ai.improvementsLine", { text: inputs.improvements }) : "",
        inputs.followUps ? t("events.ai.followUpsLine", { text: inputs.followUps }) : "",
      ];
      const result = await summarize(
        `Post-mortem ${selected.name}`,
        bullets,
        t("events.ai.prompt"),
      );
      setAiText(result.text);
    } catch {
      toastError(t("events.toast.aiError"));
    } finally {
      setAiBusy(false);
    }
  };

  const copyRetex = async () => {
    try {
      await navigator.clipboard.writeText(aiText ?? retexText);
      toastSuccess(t("events.toast.copied"));
    } catch {
      toastError(t("events.toast.copyError"));
    }
  };

  return (
      <div className="space-y-5">
        <header className="ui-surface rounded-2xl border-l-4 border-l-[var(--accent)] p-5">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            <CalendarRange className="h-3.5 w-3.5" /> {t("events.badge")}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">{t("events.title")}</h1>
          <p className="mt-1 text-sm text-[color:var(--foreground)]/55">
            {t("events.subtitle")}
          </p>
        </header>

        <EventsSectionNav basePath="/events" showRetex />

        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <aside className="ui-surface rounded-2xl p-4">
            <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">{t("events.sidebarTitle")}</h2>
            {loading ? (
              <p className="text-sm text-[color:var(--foreground)]/55">{t("events.loading")}</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-[color:var(--foreground)]/55">{t("events.emptyList")}</p>
            ) : (
              <ul className="space-y-1.5">
                {events.map((event) => {
                  const active = selected?.id === event.id;
                  return (
                    <li key={event.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(event.id)}
                        className={[
                          "ui-transition w-full rounded-xl border px-3 py-2 text-left",
                          active
                            ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                            : "border-[var(--line)] hover:border-[var(--line-strong)]",
                        ].join(" ")}
                      >
                        <span className="block truncate text-sm font-semibold text-[var(--foreground)]">
                          {event.name}
                        </span>
                        <span className="text-[11px] text-[color:var(--foreground)]/55">
                          {event.status}
                          {event.closureRecap ? t("events.statusClosed") : ""}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          {selected ? (
            <section className="space-y-4">
              <div className="ui-surface rounded-2xl p-5">
                <h3 className="mb-1 text-sm font-semibold text-[var(--foreground)]">{selected.name}</h3>
                <p className="text-xs text-[color:var(--foreground)]/55">
                  {t("events.taskProgress", { pct: taskProgressPct })}
                </p>
              </div>

              <div className="ui-surface rounded-2xl p-5">
                <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">{t("events.reportTitle")}</h3>
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground)]/55">
                      {t("events.highlightsLabel")}
                    </span>
                    <textarea
                      rows={5}
                      value={inputs.highlights}
                      onChange={(e) => update({ highlights: e.target.value })}
                      placeholder={t("events.highlightsPlaceholder")}
                      className="ui-focus-ring mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground)]/55">
                      {t("events.improvementsLabel")}
                    </span>
                    <textarea
                      rows={5}
                      value={inputs.improvements}
                      onChange={(e) => update({ improvements: e.target.value })}
                      placeholder={t("events.improvementsPlaceholder")}
                      className="ui-focus-ring mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground)]/55">
                      {t("events.followUpsLabel")}
                    </span>
                    <textarea
                      rows={5}
                      value={inputs.followUps}
                      onChange={(e) => update({ followUps: e.target.value })}
                      placeholder={t("events.followUpsPlaceholder")}
                      className="ui-focus-ring mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
                    />
                  </label>
                </div>
              </div>

              <div className="ui-surface rounded-2xl p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">{t("events.generatedTitle")}</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={aiBusy}
                      onClick={() => void enrichWithAi()}
                      className="ui-transition inline-flex items-center gap-1.5 rounded-lg border border-[var(--accent)] bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] disabled:opacity-50"
                    >
                      {aiBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      {t("events.enrichAi")}
                    </button>
                    <button
                      type="button"
                      onClick={() => void copyRetex()}
                      className="ui-transition inline-flex items-center gap-1.5 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[color:var(--foreground)]/70 hover:bg-[var(--surface-soft)]"
                    >
                      <Copy className="h-3.5 w-3.5" /> {t("events.copy")}
                    </button>
                  </div>
                </div>
                <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-4 text-xs leading-relaxed text-[color:var(--foreground)]/80">
                  {aiText ?? retexText}
                </pre>
              </div>
            </section>
          ) : (
            <div className="ui-surface rounded-2xl p-8 text-center text-sm text-[color:var(--foreground)]/55">
              {t("events.selectEvent")}
            </div>
          )}
        </div>
      </div>
  );
}
