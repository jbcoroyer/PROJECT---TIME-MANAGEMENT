"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, X } from "lucide-react";
import {
  BOARD_FIELD_TYPE_LABELS,
  type BoardField,
  type BoardFieldConfig,
  type BoardFieldType,
  type FieldOption,
  type RelationEntity,
  useBoardFields,
} from "../lib/v2/boardFields";
import { BOARD_COLUMN_PALETTE as PALETTE } from "../lib/v2/boardColumns";
import { toastError, toastSuccess } from "../lib/toast";
import { useConfirm } from "./ui/ConfirmDialog";

const RELATION_ENTITIES: { value: RelationEntity; label: string }[] = [
  { value: "companies", label: "Sociétés" },
  { value: "events", label: "Événements" },
  { value: "domains", label: "Domaines" },
];

function newOptionId() {
  return `opt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function SortableFieldRow(props: {
  field: BoardField;
  onLabelChange: (label: string) => void;
  onConfigChange: (config: BoardFieldConfig) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.field.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const options = props.field.config.options ?? [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3"
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-1 flex h-7 w-6 cursor-grab items-center justify-center rounded-md text-[color:var(--foreground)]/35 hover:bg-[var(--surface-soft)] active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={props.field.label}
              onChange={(e) => props.onLabelChange(e.target.value)}
              onBlur={() => props.onLabelChange(props.field.label.trim())}
              className="ui-focus-ring min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-2.5 py-1.5 text-sm font-semibold"
            />
            <span className="rounded-full border border-[var(--line)] bg-[var(--surface-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--foreground)]/55">
              {BOARD_FIELD_TYPE_LABELS[props.field.type]}
            </span>
            <button
              type="button"
              onClick={props.onDelete}
              className="ui-transition inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line)] text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_8%,var(--surface))]"
              title="Supprimer le champ"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-[color:var(--foreground)]/45">
            Clé immuable : <code>{props.field.key}</code>
          </p>

          {(props.field.type === "select" || props.field.type === "status") && (
            <div className="space-y-2 rounded-lg border border-dashed border-[var(--line)] p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--foreground)]/50">
                Options
              </p>
              {options.map((opt, index) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <input
                    value={opt.label}
                    onChange={(e) => {
                      const next = [...options];
                      next[index] = { ...opt, label: e.target.value };
                      props.onConfigChange({ ...props.field.config, options: next });
                    }}
                    className="ui-focus-ring min-w-0 flex-1 rounded-lg border border-[var(--line)] px-2 py-1 text-sm"
                  />
                  <div className="flex gap-1">
                    {PALETTE.map((color) => (
                      <button
                        key={color}
                        type="button"
                        title={color}
                        onClick={() => {
                          const next = [...options];
                          next[index] = { ...opt, color };
                          props.onConfigChange({ ...props.field.config, options: next });
                        }}
                        className={[
                          "h-5 w-5 rounded-full border-2",
                          opt.color === color ? "border-[var(--foreground)]" : "border-transparent",
                        ].join(" ")}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = options.filter((o) => o.id !== opt.id);
                      props.onConfigChange({ ...props.field.config, options: next });
                    }}
                    className="text-[var(--danger)]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const next: FieldOption[] = [
                    ...options,
                    { id: newOptionId(), label: "Nouvelle option", color: PALETTE[0] },
                  ];
                  props.onConfigChange({ ...props.field.config, options: next });
                }}
                className="ui-transition text-xs font-semibold text-[var(--accent)] hover:underline"
              >
                + Ajouter une option
              </button>
            </div>
          )}

          {props.field.type === "relation" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--foreground)]/50">
                  Entité liée
                </label>
                <select
                  value={props.field.config.entity ?? "companies"}
                  onChange={(e) =>
                    props.onConfigChange({
                      ...props.field.config,
                      entity: e.target.value as RelationEntity,
                    })
                  }
                  className="ui-focus-ring mt-1 w-full rounded-lg border border-[var(--line)] px-2 py-1.5 text-sm"
                >
                  {RELATION_ENTITIES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <label className="mt-5 inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={props.field.config.multiple ?? false}
                  onChange={(e) =>
                    props.onConfigChange({ ...props.field.config, multiple: e.target.checked })
                  }
                />
                Sélection multiple
              </label>
            </div>
          )}

          {props.field.type === "person" && (
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={props.field.config.multiple ?? false}
                onChange={(e) =>
                  props.onConfigChange({ ...props.field.config, multiple: e.target.checked })
                }
              />
              Sélection multiple
            </label>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BoardFieldsEditorPanel(props: {
  boardId: string;
  onClose: () => void;
}) {
  const confirm = useConfirm();
  const { fields, loading, createField, updateField, reorderFields, removeField } =
    useBoardFields(props.boardId);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<BoardFieldType>("text");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const fieldIds = useMemo(() => fields.map((f) => f.id), [fields]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(fields, oldIndex, newIndex);
    void reorderFields(reordered.map((f) => f.id)).catch(() =>
      toastError("Impossible de réordonner les champs."),
    );
  };

  const panel = (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/35">
      <aside className="flex h-full w-full max-w-lg flex-col border-l border-[var(--line)] bg-[var(--surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground)]/50">
              Personnaliser le board
            </p>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Champs personnalisés</h2>
          </div>
          <button
            type="button"
            onClick={props.onClose}
            className="ui-transition inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            <p className="text-sm text-[color:var(--foreground)]/55">Chargement…</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={fieldIds} strategy={verticalListSortingStrategy}>
                {fields.map((field) => (
                  <SortableFieldRow
                    key={field.id}
                    field={field}
                    onLabelChange={(label) => {
                      void updateField(field.id, { label }).catch(() =>
                        toastError("Impossible de renommer le champ."),
                      );
                    }}
                    onConfigChange={(config) => {
                      void updateField(field.id, { config }).catch(() =>
                        toastError("Impossible de mettre à jour la configuration."),
                      );
                    }}
                    onDelete={() => {
                      void (async () => {
                        const ok = await confirm({
                          title: "Supprimer le champ",
                          description:
                            "La définition sera supprimée. Les valeurs déjà saisies dans les tâches restent en base mais ne seront plus affichées.",
                          confirmLabel: "Supprimer",
                          variant: "destructive",
                        });
                        if (!ok) return;
                        await removeField(field.id);
                        toastSuccess("Champ supprimé.");
                      })().catch((e) =>
                        toastError(e instanceof Error ? e.message : "Suppression impossible."),
                      );
                    }}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}

          {adding ? (
            <div className="rounded-xl border border-dashed border-[var(--line)] p-3 space-y-2">
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Nom du champ"
                className="ui-focus-ring w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              />
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as BoardFieldType)}
                className="ui-focus-ring w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
              >
                {(Object.keys(BOARD_FIELD_TYPE_LABELS) as BoardFieldType[]).map((type) => (
                  <option key={type} value={type}>
                    {BOARD_FIELD_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-[var(--foreground)] px-3 py-1.5 text-xs font-semibold text-[var(--background)]"
                  onClick={() => {
                    const label = newLabel.trim();
                    if (!label) return;
                    void createField({ label, type: newType })
                      .then(() => {
                        toastSuccess("Champ ajouté.");
                        setAdding(false);
                        setNewLabel("");
                        setNewType("text");
                      })
                      .catch((e) =>
                        toastError(e instanceof Error ? e.message : "Ajout impossible."),
                      );
                  }}
                >
                  Ajouter
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs"
                  onClick={() => {
                    setAdding(false);
                    setNewLabel("");
                  }}
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="ui-transition inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--line)] px-4 py-3 text-sm font-semibold text-[color:var(--foreground)]/65 hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <Plus className="h-4 w-4" />
              Ajouter un champ
            </button>
          )}
        </div>
      </aside>
    </div>
  );

  if (typeof document === "undefined") return panel;
  return createPortal(panel, document.body);
}
