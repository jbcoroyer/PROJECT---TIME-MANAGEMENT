"use client";

import { useMemo, useRef, useState } from "react";
import { FolderOpen, ImageIcon, Plus, Search, Tag, Trash2 } from "lucide-react";
import { useReferenceData } from "../../../lib/useReferenceData";
import { DAM_TYPES, searchAssets, useDamAssets, type DamType } from "../../../lib/v2/dam";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import EmptyState from "../../ui/EmptyState";

export default function V2DamPage() {
  const { t } = useTranslation();
  const { companies } = useReferenceData();
  const { assets, add, remove } = useDamAssets();
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [company, setCompany] = useState(companies[0]?.name ?? "");
  const [type, setType] = useState<DamType>("Logo");
  const [tags, setTags] = useState("");

  const filtered = useMemo(() => searchAssets(assets, query), [assets, query]);

  const addAsset = () => {
    if (!name.trim() || !url.trim()) return;
    add({
      name: name.trim(),
      url: url.trim(),
      company,
      type,
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    });
    setName("");
    setUrl("");
    setTags("");
  };

  const isImage = (u: string) => /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test(u);

  return (
      <div className="space-y-5">
        <header className="ui-surface rounded-2xl border-l-4 border-l-[var(--accent)] p-5">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            <FolderOpen className="h-3.5 w-3.5" /> {t("damModule.badge")}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">{t("damModule.title")}</h1>
          <p className="mt-1 text-sm text-[color:var(--foreground)]/55">
            {t("damModule.subtitle")}
          </p>
        </header>

        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <section className="ui-surface rounded-2xl p-5">
            <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">{t("damModule.addTitle")}</h2>
            <div className="space-y-3">
              <input
                ref={nameInputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("damModule.name")}
                className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
              />
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t("damModule.url")} className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <select value={company} onChange={(e) => setCompany(e.target.value)} className="ui-focus-ring rounded-xl border border-[var(--line)] bg-[var(--surface)] px-2 py-2 text-sm">
                  {companies.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
                <select value={type} onChange={(e) => setType(e.target.value as DamType)} className="ui-focus-ring rounded-xl border border-[var(--line)] bg-[var(--surface)] px-2 py-2 text-sm">
                  {DAM_TYPES.map((damType) => <option key={damType} value={damType}>{damType}</option>)}
                </select>
              </div>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder={t("damModule.tags")} className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm" />
              <button type="button" onClick={addAsset} className="ui-transition inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-[var(--accent-contrast)] hover:bg-[var(--accent-strong)]">
                <Plus className="h-4 w-4" /> {t("damModule.add")}
              </button>
            </div>
          </section>

          <section className="ui-surface rounded-2xl p-5">
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2">
              <Search className="h-4 w-4 text-[color:var(--foreground)]/45" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("damModule.search")}
                className="ui-focus-ring w-full bg-transparent text-sm focus:outline-none"
              />
            </div>
            {filtered.length === 0 ? (
              <EmptyState
                compact
                icon={ImageIcon}
                title={
                  assets.length === 0 ? t("emptyStates.dam.title") : t("emptyStates.damSearch.title")
                }
                description={
                  assets.length === 0 ? t("emptyStates.dam.body") : t("emptyStates.damSearch.body")
                }
                actionLabel={assets.length === 0 ? t("emptyStates.dam.cta") : undefined}
                onAction={assets.length === 0 ? () => nameInputRef.current?.focus() : undefined}
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {filtered.map((a) => (
                  <div key={a.id} className="group overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]">
                    <a href={a.url} target="_blank" rel="noreferrer" className="block aspect-video bg-[var(--surface-soft)]">
                      {isImage(a.url) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.url} alt={a.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[color:var(--foreground)]/30">
                          <ImageIcon className="h-8 w-8" />
                        </span>
                      )}
                    </a>
                    <div className="p-2.5">
                      <div className="flex items-start justify-between gap-1">
                        <p className="truncate text-xs font-semibold text-[var(--foreground)]">{a.name}</p>
                        <button type="button" onClick={() => remove(a.id)} className="ui-transition shrink-0 text-[color:var(--foreground)]/40 hover:text-[var(--danger)]" aria-label={t("damModule.delete")}>
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="mt-0.5 text-[10px] text-[color:var(--foreground)]/50">{a.company} · {a.type}</p>
                      {a.tags.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {a.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="inline-flex items-center gap-0.5 rounded-full bg-[var(--surface-soft)] px-1.5 py-0.5 text-[9px] text-[color:var(--foreground)]/55">
                              <Tag className="h-2 w-2" /> {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
  );
}
