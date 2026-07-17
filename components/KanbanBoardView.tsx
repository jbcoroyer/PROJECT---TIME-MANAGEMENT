"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarRange,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  ListTodo,
  Plus,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import { KanbanCardUI } from "./KanbanCard";
import AdminAvatar from "./AdminAvatar";
import type { Task, ColumnId, AdminId } from "../lib/types";
import type { ReferenceRecord } from "../lib/referenceData";
import {
  adminFilterPillClassFor,
  adminSolidColorFor,
} from "../lib/kanbanStyles";
import {
  loadCollapsedEventGroupIds,
  persistCollapsedEventGroupIds,
  toggleCollapsedEventGroup,
} from "../lib/eventGroupCollapse";
import { partitionTasksByEvent, sortTasksByDeadline } from "../lib/eventTaskGroups";
import KanbanColumnHeader from "./KanbanColumnHeader";
import BoardFieldsEditorPanel from "./BoardFieldsEditorPanel";
import {
  ensureDefaultBoard,
  useBoardColumns,
  type BoardColumn,
} from "../lib/v2/boardColumns";
import { defaultColumns } from "../lib/types";
import { getSupabaseBrowser } from "../lib/supabaseBrowser";
import { toastError, toastSuccess } from "../lib/toast";
import { useConfirm } from "./ui/ConfirmDialog";

/** Au-dessus de ce seuil, les cartes passent en mode compact (même en « vue détaillée »). */
const KANBAN_AUTO_COMPACT_MIN = 8;
/** Colonnes très remplies : cartes encore plus denses. */
const KANBAN_DENSE_MIN = 14;

type KanbanCardDisplayMode = "full" | "compact" | "dense";

function resolveKanbanCardDisplayMode(
  density: "compact" | "detailed",
  columnTaskCount: number,
): KanbanCardDisplayMode {
  const many = columnTaskCount >= KANBAN_AUTO_COMPACT_MIN;
  const veryMany = columnTaskCount >= KANBAN_DENSE_MIN;

  if (density === "compact") {
    return veryMany ? "dense" : "compact";
  }
  if (!many) return "full";
  if (veryMany) return "dense";
  return "compact";
}

const COL_DROP_PREFIX = "col-drop:";
const COL_SORT_PREFIX = "col-sort:";

function colDropId(columnId: string) {
  return `${COL_DROP_PREFIX}${columnId}`;
}

function colSortId(columnId: string) {
  return `${COL_SORT_PREFIX}${columnId}`;
}

const KANBAN_EDIT_HINTS_KEY = "kanban-edit-hints-dismissed";

function KanbanColumn(props: {
  column: BoardColumn;
  children: React.ReactNode;
  count: number;
  editable?: boolean;
  sortable?: boolean;
  onAddTask?: () => void;
  tightList?: boolean;
  onRename: (label: string) => Promise<void>;
  onColorChange: (color: string) => Promise<void>;
  onDeleteRequest: () => void;
}) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: colDropId(props.column.id) });
  const {
    attributes,
    listeners,
    setNodeRef: setSortRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: colSortId(props.column.id),
    disabled: !props.sortable,
  });
  const sortableStyle = props.sortable
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
      }
    : undefined;
  const dragHandleProps = props.sortable
    ? ({ ...attributes, ...listeners } as Record<string, unknown>)
    : undefined;

  return (
    <div
      ref={props.sortable ? setSortRef : undefined}
      style={sortableStyle}
      className="flex min-w-0 flex-1 basis-0 flex-col border-r border-[rgba(26,22,17,0.1)] px-1.5 last:border-r-0 sm:px-2"
    >
      <div className="min-w-0">
        <KanbanColumnHeader
          column={props.column}
          count={props.count}
          editable={props.editable}
          dragHandleProps={dragHandleProps}
          onRename={props.onRename}
          onColorChange={props.onColorChange}
          onDeleteRequest={props.onDeleteRequest}
          onAddTask={props.onAddTask}
        />
      </div>

      <div
        ref={setDropRef}
        className={[
          "flex flex-1 flex-col transition-all duration-150 gap-2.5",
          isOver ? "rounded-2xl bg-[rgba(255,255,255,0.4)]" : "",
        ].join(" ")}
        style={{ minHeight: 140 }}
      >
        {props.children}
      </div>
    </div>
  );
}

function DraggableCard(props: {
  task: Task;
  now: number;
  companyLogoUrl?: string | null;
  onArchive: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpen: () => void;
  isMyTask?: boolean;
  cardRef?: (el: HTMLDivElement | null) => void;
  cardVariant?: KanbanCardDisplayMode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: props.task.id,
  });

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        props.cardRef?.(el);
      }}
      {...listeners}
      {...attributes}
      onClick={props.onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          props.onOpen();
        }
      }}
      className={[
        "cursor-grab rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-300 active:cursor-grabbing",
        isDragging ? "opacity-25 scale-95" : "",
      ].join(" ")}
      title="Cliquer pour ouvrir et modifier la tâche"
      aria-label={`Ouvrir la tâche ${props.task.projectName || "sans titre"} pour modifier domaine, priorité et détails`}
    >
      <KanbanCardUI
        task={props.task}
        currentNow={props.now}
        variant={props.cardVariant ?? "compact"}
        isMyTask={props.isMyTask}
        companyLogoUrl={props.companyLogoUrl}
        onArchive={props.onArchive}
        onEdit={props.onEdit}
        onDelete={props.onDelete}
      />
    </div>
  );
}

function DraggableEventGroup(props: {
  dragId: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: props.dragId,
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={[
        "cursor-grab rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-300 active:cursor-grabbing",
        isDragging ? "opacity-55 scale-[0.99]" : "",
      ].join(" ")}
    >
      {props.children}
    </div>
  );
}

export default function KanbanBoardView(props: {
  tasks: Task[];
  columns: string[];
  admins: string[];
  companies: string[];
  companyRecords?: ReferenceRecord[];
  now: number;
  onMoveTask: (taskId: string, newColumn: ColumnId) => void;
  onOpenTask: (taskId: string) => void;
  onArchiveTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onAddTaskForColumn?: (column: ColumnId) => void;
  onColumnCreated?: () => void;
  taskCardRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  onTaskFocus?: (taskId: string) => void;
  currentUserName?: string | null;
}) {
  const companyLogoMap = useMemo(() => {
    const map: Record<string, string | null> = {};
    for (const c of props.companyRecords ?? []) {
      map[c.name] = c.logoUrl ?? null;
    }
    return map;
  }, [props.companyRecords]);
  const defaultFilterAdmin = useMemo((): AdminId | "Tous" => {
    if (props.currentUserName && props.admins.includes(props.currentUserName)) {
      return props.currentUserName as AdminId;
    }
    return "Tous";
  }, [props.currentUserName, props.admins]);

  const filterTouchedRef = useRef(false);
  const [filterAdmin, setFilterAdminState] = useState<AdminId | "Tous">(() => defaultFilterAdmin);

  const setFilterAdmin = (value: AdminId | "Tous") => {
    filterTouchedRef.current = true;
    setFilterAdminState(value);
  };

  useEffect(() => {
    if (filterTouchedRef.current) return;
    if (defaultFilterAdmin === "Tous") return;
    queueMicrotask(() => setFilterAdminState(defaultFilterAdmin));
  }, [defaultFilterAdmin]);
  const [filterCompany, setFilterCompany] = useState<string>("Toutes");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [cardDensity, setCardDensity] = useState<"compact" | "detailed">("detailed");
  const [collapsedEventIds, setCollapsedEventIds] = useState<Set<string>>(() =>
    loadCollapsedEventGroupIds(),
  );
  const [boardId, setBoardId] = useState<string | null>(null);
  const [fieldsEditorOpen, setFieldsEditorOpen] = useState(false);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<BoardColumn | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState("");
  const [editHintsDismissed, setEditHintsDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return localStorage.getItem(KANBAN_EDIT_HINTS_KEY) === "1";
    } catch {
      return false;
    }
  });
  const confirm = useConfirm();

  const {
    columns: boardColumns,
    createColumn,
    renameColumn,
    setColumnColor,
    reorderColumns,
    removeColumn,
    countTasksInColumn,
  } = useBoardColumns(boardId);

  useEffect(() => {
    void ensureDefaultBoard()
      .then((id) => setBoardId(id))
      .catch(() => setBoardId(null));
  }, []);

  const dismissEditHints = () => {
    setEditHintsDismissed(true);
    try {
      localStorage.setItem(KANBAN_EDIT_HINTS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const displayColumns = useMemo((): BoardColumn[] => {
    if (boardColumns.length > 0) return boardColumns;
    const labels =
      props.columns.length > 0 ? props.columns : [...defaultColumns];
    return labels.map((label, index) => ({
      id: `fallback-${index}`,
      boardId: boardId ?? "",
      organizationId: "",
      label,
      color: "#94a3b8",
      position: index,
      wipLimit: null,
      isDone: label === "Terminé",
    }));
  }, [boardColumns, props.columns, boardId]);

  const canEditColumns = boardColumns.length > 0 && Boolean(boardId);

  const columnByDropId = useMemo(() => {
    const map = new Map<string, BoardColumn>();
    for (const col of displayColumns) map.set(colDropId(col.id), col);
    return map;
  }, [displayColumns]);

  const moveTaskToColumn = (taskId: string, column: BoardColumn) => {
    props.onMoveTask(taskId, column.label);
    if (boardId && !column.id.startsWith("fallback-")) {
      void getSupabaseBrowser()
        .from("tasks")
        .update({ board_id: boardId, board_column_id: column.id })
        .eq("id", taskId);
    }
  };

  const toggleEventGroupCollapse = (eventId: string) => {
    setCollapsedEventIds((prev) => {
      const next = toggleCollapsedEventGroup(prev, eventId);
      persistCollapsedEventGroupIds(next);
      return next;
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const filteredTasks = useMemo(
    () =>
      props.tasks.filter((task) => {
        if (filterAdmin !== "Tous" && !task.admins.includes(filterAdmin)) return false;
        if (filterCompany !== "Toutes" && task.company !== filterCompany) return false;
        return true;
      }),
    [props.tasks, filterAdmin, filterCompany],
  );

  /** Nombre de tâches par admin (pour les pills) */
  const adminCounts = useMemo(
    () =>
      props.admins.reduce<Record<string, number>>((acc, admin) => {
        acc[admin] = props.tasks.filter((t) => t.admins.includes(admin)).length;
        return acc;
      }, {}),
    [props.admins, props.tasks],
  );

  const activeTask = activeId
    ? (props.tasks.find((t) => t.id === activeId) ?? null)
    : null;
  const isGroupDrag = activeId?.startsWith("event:") ?? false;

  const groupedDragMap = useMemo(() => {
    const map: Record<string, { eventName: string; sourceColumn: ColumnId; taskIds: string[]; targetColumn: BoardColumn }> = {};
    for (const col of displayColumns) {
      const colTasks = filteredTasks.filter((t) => t.column === col.label);
      const { groups } = partitionTasksByEvent(colTasks);
      for (const [eventId, evTasks] of groups) {
        const dragId = `event:${col.label}:${eventId}`;
        map[dragId] = {
          eventName: evTasks[0]?.eventName ?? "Événement",
          sourceColumn: col.label as ColumnId,
          taskIds: evTasks.map((t) => t.id),
          targetColumn: col,
        };
      }
    }
    return map;
  }, [filteredTasks, displayColumns]);

  const activeGroup = activeId ? groupedDragMap[activeId] : undefined;

  const overlayDisplayMode: KanbanCardDisplayMode = activeTask
    ? resolveKanbanCardDisplayMode(
        cardDensity,
        filteredTasks.filter((t) => t.column === activeTask.column).length,
      )
    : "compact";

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeKey = String(active.id);
    if (activeKey.startsWith(COL_SORT_PREFIX) && canEditColumns) {
      const overKey = String(over.id);
      if (!overKey.startsWith(COL_SORT_PREFIX)) return;
      const oldIndex = displayColumns.findIndex((c) => colSortId(c.id) === activeKey);
      const newIndex = displayColumns.findIndex((c) => colSortId(c.id) === overKey);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
      const reordered = arrayMove(displayColumns, oldIndex, newIndex);
      void reorderColumns(reordered.map((c) => c.id)).catch(() =>
        toastError("Impossible de réordonner les colonnes."),
      );
      return;
    }

    const targetColumn = columnByDropId.get(String(over.id));
    if (!targetColumn) return;

    const grouped = groupedDragMap[activeKey];
    if (grouped) {
      if (grouped.sourceColumn === targetColumn.label) return;
      grouped.taskIds.forEach((taskId) => moveTaskToColumn(taskId, targetColumn));
      return;
    }

    const task = props.tasks.find((t) => t.id === active.id);
    if (!task || task.column === targetColumn.label) return;
    moveTaskToColumn(active.id as string, targetColumn);
  };

  const handleDeleteColumn = async (column: BoardColumn) => {
    if (!canEditColumns) return;
    try {
      const count = await countTasksInColumn(column);
      if (count > 0) {
        setDeleteTarget(column);
        setReassignTargetId("");
        return;
      }
      const ok = await confirm({
        title: "Supprimer la colonne",
        description: `Supprimer « ${column.label} » ?`,
        confirmLabel: "Supprimer",
        variant: "destructive",
      });
      if (!ok) return;
      await removeColumn(column.id);
      toastSuccess("Colonne supprimée.");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Suppression impossible.");
    }
  };

  const confirmDeleteWithReassign = async () => {
    if (!deleteTarget || !reassignTargetId) return;
    try {
      await removeColumn(deleteTarget.id, reassignTargetId);
      toastSuccess("Colonne supprimée et tâches réaffectées.");
      setDeleteTarget(null);
      setReassignTargetId("");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Suppression impossible.");
    }
  };

  const hasActiveFilters = filterAdmin !== "Tous" || filterCompany !== "Toutes";

  return (
    <div className="space-y-4">
      {/* ── Barre de filtres ── */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
        {/* Légende / filtre par collaborateur */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground)]/50">
            Voir
          </span>

          {/* Pill "Tous" */}
          <button
            type="button"
            onClick={() => setFilterAdmin("Tous")}
            className={[
              "ui-transition inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition-all",
              filterAdmin === "Tous"
                ? "border-[var(--line-strong)] bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                : "border-[var(--line)] bg-[var(--surface-soft)] text-[color:var(--foreground)]/65 hover:bg-[var(--surface)]",
            ].join(" ")}
          >
            Tous
            <span className="rounded-full bg-current/20 px-1.5 py-0.5 text-[9px]">
              {props.tasks.length}
            </span>
          </button>

          {/* Pills par admin */}
          {props.admins.map((admin) => {
            const isActive = filterAdmin === admin;
            const color = adminSolidColorFor(admin);
            const pillClass = adminFilterPillClassFor(admin);
            return (
              <button
                key={admin}
                type="button"
                onClick={() => setFilterAdmin(isActive ? "Tous" : (admin as AdminId))}
                style={isActive ? { borderColor: color, boxShadow: `0 0 0 2px ${color}33` } : {}}
                className={[
                  "ui-transition inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all",
                  pillClass,
                  isActive ? "ring-2" : "opacity-80 hover:opacity-100",
                ].join(" ")}
              >
                <AdminAvatar admin={admin as AdminId} size="sm" />
                <span>{admin.split(" ")[0]}</span>
                <span
                  className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                  style={{ backgroundColor: `${color}22`, color }}
                >
                  {adminCounts[admin] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {props.companies.length > 0 ? (
        <>
        <div className="h-5 w-px bg-[var(--line)] hidden sm:block" />

        {/* Filtre société */}
        <div className="flex items-center gap-2">
          <label className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground)]/50">
            Société
          </label>
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="ui-focus-ring rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-2.5 py-1.5 text-sm text-[var(--foreground)] focus:outline-none"
          >
            <option value="Toutes">Toutes</option>
            {props.companies.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
        </div>
        </>
        ) : null}

        {/* Reset */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setFilterAdmin("Tous");
              setFilterCompany("Toutes");
            }}
            className="ui-transition inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface-soft)] px-2.5 py-1 text-[11px] font-medium text-[color:var(--foreground)]/65 hover:bg-[var(--surface)]"
          >
            <X className="h-3 w-3" />
            Réinitialiser
          </button>
        )}

        {boardId ? (
          <button
            type="button"
            onClick={() => setFieldsEditorOpen(true)}
            title="Ajouter ou modifier des champs personnalisés sur les tâches"
            className="ui-transition ml-auto inline-flex items-center gap-1.5 rounded-lg border border-[color-mix(in_srgb,var(--accent)_35%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_8%,var(--surface-soft))] px-3 py-1.5 text-[11px] font-semibold text-[var(--accent)] hover:border-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_14%,var(--surface-soft))]"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Champs &amp; libellés
          </button>
        ) : (
          <span className="ml-auto" />
        )}
        <span className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-2.5 py-1.5 text-[11px] font-semibold text-[color:var(--foreground)]/65">
          {filteredTasks.length} tâche{filteredTasks.length !== 1 ? "s" : ""}
        </span>
        <button
          type="button"
          onClick={() => setCardDensity((v) => (v === "compact" ? "detailed" : "compact"))}
          className="ui-transition inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-2.5 py-1.5 text-[11px] font-semibold text-[color:var(--foreground)]/70 hover:bg-[var(--surface)]"
          title={
            cardDensity === "compact"
              ? "Toutes les cartes en mode compact (dense si 14+ tâches dans la colonne)."
              : `Cartes détaillées si moins de ${KANBAN_AUTO_COMPACT_MIN} tâches par colonne ; au-delà, affichage compact automatique.`
          }
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Vue {cardDensity === "compact" ? "compacte" : "détaillée"}
        </button>
      </div>

      {canEditColumns && !editHintsDismissed ? (
        <div
          role="note"
          className="relative rounded-2xl border border-[color-mix(in_srgb,var(--accent)_28%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_7%,var(--surface))] px-4 py-3 pr-11 shadow-[0_1px_2px_rgba(20,17,13,0.04)]"
        >
          <button
            type="button"
            onClick={dismissEditHints}
            className="ui-transition absolute right-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[color:var(--foreground)]/55 shadow-sm hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--line))] hover:text-[color:var(--foreground)]/85"
            aria-label="Fermer cette aide"
            title="Fermer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--foreground)]">Tout est modifiable depuis ce board</p>
              <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-[color:var(--foreground)]/72">
                <li>
                  <strong className="text-[var(--foreground)]">Colonnes</strong> — survolez un titre (« À faire », « En cours »…) puis cliquez pour le renommer ; menu <strong>⋯</strong> pour la couleur
                </li>
                <li>
                  <strong className="text-[var(--foreground)]">Tâches</strong> — cliquez une carte, puis <strong>Modifier</strong> pour changer domaine, priorité, état…
                </li>
                <li>
                  <strong className="text-[var(--foreground)]">Champs personnalisés</strong> — bouton <strong>Champs &amp; libellés</strong> ci-dessus
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Tableau Kanban ── */}
      <section className="rounded-3xl border border-[var(--line)] bg-[var(--surface)]/85 p-3 shadow-[0_1px_2px_rgba(20,17,13,0.04)] backdrop-blur sm:p-5">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={canEditColumns ? displayColumns.map((c) => colSortId(c.id)) : []}
            strategy={horizontalListSortingStrategy}
          >
          <div className="flex w-full min-w-0 items-stretch overflow-hidden border-t border-[rgba(26,22,17,0.16)] pt-4 sm:pt-5">
            {displayColumns.map((col) => {
              const colTasks = filteredTasks
                .filter((t) => t.column === col.label)
                .sort(sortTasksByDeadline);
              const { standalone, groups } = partitionTasksByEvent(colTasks);
              const columnDisplayMode = resolveKanbanCardDisplayMode(cardDensity, colTasks.length);
              const tightColumn = colTasks.length >= KANBAN_AUTO_COMPACT_MIN;
              const columnChildren = (
                <>
                  {standalone.map((task) => (
                    <DraggableCard
                      key={task.id}
                      task={task}
                      now={props.now}
                      companyLogoUrl={companyLogoMap[task.company] ?? null}
                      isMyTask={
                        props.currentUserName
                          ? task.admins.includes(props.currentUserName)
                          : false
                      }
                      onArchive={() => props.onArchiveTask(task.id)}
                      onEdit={() => props.onEditTask(task)}
                      onDelete={() => props.onDeleteTask(task.id)}
                      onOpen={() => {
                        props.onTaskFocus?.(task.id);
                        props.onOpenTask(task.id);
                      }}
                      cardRef={(el) => {
                        props.taskCardRefs.current[task.id] = el;
                      }}
                      cardVariant={columnDisplayMode}
                    />
                  ))}
                  {groups.map(([eventId, evTasks]) => {
                    const collapsed = collapsedEventIds.has(eventId);
                    const eventDragId = `event:${col.label}:${eventId}`;
                    return (
                      <DraggableEventGroup key={eventId} dragId={eventDragId}>
                        <div
                          className={[
                            "rounded-2xl border border-[var(--line)]/85 bg-[var(--surface-soft)]",
                            tightColumn ? "p-1.5" : "p-2",
                            collapsed ? "" : tightColumn ? "space-y-1" : "space-y-2",
                          ].join(" ")}
                        >
                          <div className="flex items-center gap-1.5 px-0.5 pb-1 pt-0.5">
                            <button
                              type="button"
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={() => toggleEventGroupCollapse(eventId)}
                              className="ui-transition flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[color:var(--foreground)]/55 hover:bg-[var(--surface-soft)] hover:text-[color:var(--foreground)]/75"
                              title={collapsed ? "Déplier les tâches de l'événement" : "Replier (nom de l'événement seulement)"}
                              aria-expanded={!collapsed}
                            >
                              {collapsed ? (
                                <ChevronRight className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                            <Link
                              href={`/events/${eventId}`}
                              className="flex min-w-0 flex-1 items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--foreground)]/75 hover:underline"
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <CalendarRange className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{evTasks[0]?.eventName ?? "Événement"}</span>
                            </Link>
                            <span className="shrink-0 rounded-full bg-[var(--surface)] px-2 py-0.5 text-[10px] font-semibold text-[color:var(--foreground)]/55">
                              {evTasks.length} tâche{evTasks.length > 1 ? "s" : ""}
                            </span>
                          </div>
                          {!collapsed && (
                            <div className="space-y-2">
                              {evTasks.map((task) => (
                                <DraggableCard
                                  key={task.id}
                                  task={task}
                                  now={props.now}
                                  companyLogoUrl={companyLogoMap[task.company] ?? null}
                                  isMyTask={
                                    props.currentUserName
                                      ? task.admins.includes(props.currentUserName)
                                      : false
                                  }
                                  onArchive={() => props.onArchiveTask(task.id)}
                                  onEdit={() => props.onEditTask(task)}
                                  onDelete={() => props.onDeleteTask(task.id)}
                                  onOpen={() => {
                                    props.onTaskFocus?.(task.id);
                                    props.onOpenTask(task.id);
                                  }}
                                  cardRef={(el) => {
                                    props.taskCardRefs.current[task.id] = el;
                                  }}
                                  cardVariant={columnDisplayMode}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </DraggableEventGroup>
                    );
                  })}
                  {colTasks.length === 0 && (
                    <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-1 py-6 text-center sm:gap-2 sm:py-10">
                      <ListTodo className="h-6 w-6 text-[color:var(--foreground)]/20 sm:h-8 sm:w-8" />
                      <p className="text-[10px] text-[color:var(--foreground)]/45 sm:text-xs">Aucune tâche ici.</p>
                      <p className="hidden text-[11px] text-[color:var(--foreground)]/35 sm:block">
                        Créez-en une avec le bouton + ou la touche N.
                      </p>
                    </div>
                  )}
                </>
              );

              if (canEditColumns) {
                return (
                  <KanbanColumn
                    key={col.id}
                    column={col}
                    count={colTasks.length}
                    editable
                    sortable
                    tightList={tightColumn}
                    onAddTask={
                      props.onAddTaskForColumn
                        ? () => props.onAddTaskForColumn!(col.label as ColumnId)
                        : undefined
                    }
                    onRename={async (label) => {
                      try {
                        await renameColumn(col.id, label);
                        toastSuccess("Colonne renommée.");
                      } catch (e) {
                        toastError(e instanceof Error ? e.message : "Renommage impossible.");
                        throw e;
                      }
                    }}
                    onColorChange={async (color) => {
                      try {
                        await setColumnColor(col.id, color);
                      } catch {
                        toastError("Impossible de changer la couleur.");
                      }
                    }}
                    onDeleteRequest={() => void handleDeleteColumn(col)}
                  >
                    {columnChildren}
                  </KanbanColumn>
                );
              }

              return (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  count={colTasks.length}
                  editable={false}
                  sortable={false}
                  tightList={tightColumn}
                  onAddTask={
                    props.onAddTaskForColumn
                      ? () => props.onAddTaskForColumn!(col.label as ColumnId)
                      : undefined
                  }
                  onRename={async () => {}}
                  onColorChange={async () => {}}
                  onDeleteRequest={() => {}}
                >
                  {columnChildren}
                </KanbanColumn>
              );
            })}
            {canEditColumns ? (
              <div className="relative flex shrink-0 flex-col self-start pl-1 sm:pl-2">
                {addingColumn ? (
                  <div className="absolute left-0 top-0 z-20 w-56 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-[0_12px_40px_rgba(20,17,13,0.12)]">
                    <input
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      placeholder="Nom de la colonne"
                      autoFocus
                      className="ui-focus-ring mb-2 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setAddingColumn(false);
                          setNewColumnName("");
                        }
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const name = newColumnName.trim();
                          if (!name) return;
                          void createColumn(name)
                            .then(() => {
                              toastSuccess("Colonne ajoutée.");
                              setAddingColumn(false);
                              setNewColumnName("");
                              props.onColumnCreated?.();
                            })
                            .catch((err) =>
                              toastError(err instanceof Error ? err.message : "Ajout impossible."),
                            );
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="ui-transition rounded-lg bg-[var(--foreground)] px-3 py-1.5 text-xs font-semibold text-[var(--background)]"
                        onClick={() => {
                          const name = newColumnName.trim();
                          if (!name) return;
                          void createColumn(name)
                            .then(() => {
                              toastSuccess("Colonne ajoutée.");
                              setAddingColumn(false);
                              setNewColumnName("");
                              props.onColumnCreated?.();
                            })
                            .catch((err) =>
                              toastError(err instanceof Error ? err.message : "Ajout impossible."),
                            );
                        }}
                      >
                        Ajouter
                      </button>
                      <button
                        type="button"
                        className="ui-transition rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs"
                        onClick={() => {
                          setAddingColumn(false);
                          setNewColumnName("");
                        }}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => setAddingColumn(true)}
                  data-tutorial="add-column-button"
                  className="ui-transition inline-flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-[color-mix(in_srgb,var(--accent)_35%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_4%,var(--surface-soft))] text-[var(--accent)] hover:border-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface-soft))]"
                  title="Ajouter une colonne"
                  aria-label="Ajouter une colonne"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
          </div>
          </SortableContext>

          {typeof document !== "undefined" &&
            createPortal(
              <DragOverlay>
                {activeTask && (
                  <KanbanCardUI
                    task={activeTask}
                    currentNow={props.now}
                    variant={overlayDisplayMode}
                    isOverlay
                    onArchive={() => {}}
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                )}
                {isGroupDrag && activeGroup && (
                  <div className="rounded-2xl border border-[var(--line-strong)] bg-[var(--surface)] px-3 py-2 shadow-[0_16px_30px_rgba(20,17,13,0.12)]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground)]/60">
                      Déplacement du bloc
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-[var(--foreground)]">
                      {activeGroup.eventName}
                    </p>
                    <p className="text-[11px] text-[color:var(--foreground)]/60">
                      {activeGroup.taskIds.length} tâche{activeGroup.taskIds.length > 1 ? "s" : ""}
                    </p>
                  </div>
                )}
              </DragOverlay>,
              document.body,
            )}
        </DndContext>
      </section>

      {deleteTarget ? (
        <div className="ui-modal-overlay">
          <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Supprimer la colonne</h3>
            <p className="mt-2 text-sm text-[color:var(--foreground)]/70">
              « {deleteTarget.label} » contient des tâches. Choisissez une colonne de réaffectation.
            </p>
            <select
              value={reassignTargetId}
              onChange={(e) => setReassignTargetId(e.target.value)}
              className="ui-focus-ring mt-4 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm"
            >
              <option value="">— Choisir une colonne —</option>
              {displayColumns
                .filter((c) => c.id !== deleteTarget.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
            </select>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="ui-transition rounded-lg border border-[var(--line)] px-4 py-2 text-sm"
                onClick={() => {
                  setDeleteTarget(null);
                  setReassignTargetId("");
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={!reassignTargetId}
                className="ui-transition rounded-lg bg-[var(--danger)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                onClick={() => void confirmDeleteWithReassign()}
              >
                Supprimer et réaffecter
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {fieldsEditorOpen && boardId ? (
        <BoardFieldsEditorPanel boardId={boardId} onClose={() => setFieldsEditorOpen(false)} />
      ) : null}
    </div>
  );
}
