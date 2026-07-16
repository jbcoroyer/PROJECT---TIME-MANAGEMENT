"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { BoardField, BoardFieldType } from "../../../../lib/v2/boardFields";
import type { CustomFieldsMap } from "../../../../lib/v2/customFieldValues";
import { useTranslation } from "../../../../lib/i18n/useTranslation";
import {
  entityKindForPerson,
  entityKindForRelation,
  listOptions,
  resolveLabel,
  resolveLabels,
  type EntityKind,
  type EntityOption,
} from "../../../../lib/v2/relationEntities";

type Props = {
  fields: BoardField[];
  values: CustomFieldsMap;
  onChange?: (field: BoardField, value: unknown) => void;
  readOnly?: boolean;
};

function getOptions(field: BoardField) {
  return field.config.options ?? [];
}

function FieldLabel({ field }: { field: BoardField }) {
  return (
    <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--foreground)]/55">
      {field.label}
    </label>
  );
}

function ReadonlyValue({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{children || "—"}</p>;
}

function EntityReadonly({
  kind,
  value,
  multiple,
}: {
  kind: EntityKind;
  value: unknown;
  multiple?: boolean;
}) {
  const [labels, setLabels] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (multiple && Array.isArray(value)) {
        const map = await resolveLabels(
          kind,
          value.filter((v): v is string => typeof v === "string"),
        );
        if (!cancelled) setLabels([...map.values()]);
        return;
      }
      if (typeof value === "string" && value) {
        const label = await resolveLabel(kind, value);
        if (!cancelled) setLabels([label]);
        return;
      }
      if (!cancelled) setLabels([]);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [kind, multiple, value]);

  return <ReadonlyValue>{labels.length > 0 ? labels.join(", ") : "—"}</ReadonlyValue>;
}

function EntitySelect({
  kind,
  value,
  multiple,
  readOnly,
  onChange,
  noneLabel,
}: {
  kind: EntityKind;
  value: unknown;
  multiple?: boolean;
  readOnly?: boolean;
  onChange: (value: unknown) => void;
  noneLabel: string;
}) {
  const [options, setOptions] = useState<EntityOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    void listOptions(kind).then((rows) => {
      if (!cancelled) setOptions(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  if (readOnly) {
    return <EntityReadonly kind={kind} value={value} multiple={multiple} />;
  }

  if (multiple) {
    const selected = Array.isArray(value)
      ? value.filter((v): v is string => typeof v === "string")
      : [];
    return (
      <select
        multiple
        value={selected}
        onChange={(e) => {
          const next = Array.from(e.target.selectedOptions).map((o) => o.value);
          onChange(next);
        }}
        className="ui-focus-ring mt-1 min-h-[88px] w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-sm"
      >
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  const selected = typeof value === "string" ? value : "";
  return (
    <select
      value={selected}
      onChange={(e) => onChange(e.target.value || null)}
      className="ui-focus-ring mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-sm"
    >
      <option value="">{noneLabel}</option>
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function SelectField({
  field,
  value,
  readOnly,
  onChange,
  noneLabel,
}: {
  field: BoardField;
  value: unknown;
  readOnly?: boolean;
  onChange: (value: unknown) => void;
  noneLabel: string;
}) {
  const options = getOptions(field);
  const selected = typeof value === "string" ? value : "";

  if (readOnly) {
    const opt = options.find((o) => o.id === selected);
    return (
      <ReadonlyValue>
        {opt ? (
          <span className="inline-flex items-center gap-2">
            {opt.color ? (
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: opt.color }} />
            ) : null}
            {opt.label}
          </span>
        ) : (
          "—"
        )}
      </ReadonlyValue>
    );
  }

  return (
    <select
      value={selected}
      onChange={(e) => onChange(e.target.value || null)}
      className="ui-focus-ring mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-sm"
    >
      <option value="">{noneLabel}</option>
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function renderFieldInput(
  field: BoardField,
  value: unknown,
  readOnly: boolean | undefined,
  onChange: (value: unknown) => void,
  labels: { yes: string; no: string; checked: string; none: string },
) {
  switch (field.type) {
    case "text":
      if (readOnly) return <ReadonlyValue>{typeof value === "string" ? value : ""}</ReadonlyValue>;
      return (
        <input
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className="ui-focus-ring mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-sm"
        />
      );
    case "number":
      if (readOnly) {
        return <ReadonlyValue>{typeof value === "number" ? String(value) : ""}</ReadonlyValue>;
      }
      return (
        <input
          type="number"
          value={typeof value === "number" ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          className="ui-focus-ring mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-sm"
        />
      );
    case "date":
      if (readOnly) return <ReadonlyValue>{typeof value === "string" ? value : ""}</ReadonlyValue>;
      return (
        <input
          type="date"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || null)}
          className="ui-focus-ring mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-sm"
        />
      );
    case "checkbox":
      if (readOnly) {
        return <ReadonlyValue>{value === true ? labels.yes : labels.no}</ReadonlyValue>;
      }
      return (
        <label className="mt-2 inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--line)]"
          />
          {labels.checked}
        </label>
      );
    case "url":
      if (readOnly) {
        const url = typeof value === "string" ? value : "";
        return url ? (
          <a href={url} target="_blank" rel="noreferrer" className="mt-1 block text-sm text-[var(--accent)] underline">
            {url}
          </a>
        ) : (
          <ReadonlyValue>—</ReadonlyValue>
        );
      }
      return (
        <input
          type="url"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className="ui-focus-ring mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-sm"
        />
      );
    case "select":
    case "status":
      return <SelectField field={field} value={value} readOnly={readOnly} onChange={onChange} noneLabel={labels.none} />;
    case "person":
      return (
        <EntitySelect
          kind={entityKindForPerson()}
          value={value}
          multiple={field.config.multiple}
          readOnly={readOnly}
          onChange={onChange}
          noneLabel={labels.none}
        />
      );
    case "relation": {
      const entity = field.config.entity ?? "companies";
      return (
        <EntitySelect
          kind={entityKindForRelation(entity)}
          value={value}
          multiple={field.config.multiple}
          readOnly={readOnly}
          onChange={onChange}
          noneLabel={labels.none}
        />
      );
    }
    default:
      return <ReadonlyValue>—</ReadonlyValue>;
  }
}

export default function CustomFieldInputs({ fields, values, onChange, readOnly }: Props) {
  const { t, locale } = useTranslation();
  const sorted = useMemo(
    () => [...fields].sort((a, b) => a.position - b.position || a.label.localeCompare(b.label, locale)),
    [fields, locale],
  );
  const fieldLabels = useMemo(
    () => ({
      yes: t("dashboard.yes"),
      no: t("dashboard.no"),
      checked: t("dashboard.checked"),
      none: t("dashboard.none"),
    }),
    [t],
  );

  if (sorted.length === 0) return null;

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--line)]/80 bg-[var(--surface-soft)] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--foreground)]/50">
        {t("dashboard.customFields.title")}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sorted.map((field) => (
          <div key={field.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2">
            <FieldLabel field={field} />
            {renderFieldInput(field, values[field.key], readOnly, (value) => {
              onChange?.(field, value);
            }, fieldLabels)}
          </div>
        ))}
      </div>
    </div>
  );
}
