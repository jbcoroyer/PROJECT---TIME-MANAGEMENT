export type StockIdeaCategory = "materiel" | "process" | "communication" | "autre";
export type StockIdeaStatus = "nouveau" | "etude" | "adopte" | "archive";

/** Catégorie par défaut — conservée en base pour rétro-compat, masquée dans l'UI. */
export const DEFAULT_STOCK_IDEA_CATEGORY: StockIdeaCategory = "autre";

export type StockIdea = {
  id: string;
  createdAt: string;
  title: string;
  description: string;
  category: StockIdeaCategory;
  status: StockIdeaStatus;
  votes: number;
};
