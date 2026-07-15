/** Kits prédéfinis : résolution par nom d'article (contient, insensible à la casse). */
export type EventStockKitItem = {
  nameIncludes: string;
  quantity: number;
};

export type EventStockKit = {
  key: string;
  label: string;
  description: string;
  items: EventStockKitItem[];
};

/** Aucun kit prédéfini : les besoins matériel sont saisis manuellement. */
export const eventStockKits: EventStockKit[] = [];

export function resolveKitToInventoryIds(
  kit: EventStockKit,
  inventory: Array<{ id: string; name: string }>,
): Array<{ inventoryItemId: string; quantity: number; label: string }> {
  const resolved: Array<{ inventoryItemId: string; quantity: number; label: string }> = [];
  const used = new Set<string>();

  for (const need of kit.items) {
    const needle = need.nameIncludes.toLowerCase();
    const match = inventory.find(
      (i) => !used.has(i.id) && i.name.toLowerCase().includes(needle),
    );
    if (match) {
      used.add(match.id);
      resolved.push({
        inventoryItemId: match.id,
        quantity: need.quantity,
        label: match.name,
      });
    }
  }
  return resolved;
}
