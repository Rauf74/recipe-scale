export type UserRole = "OWNER" | "CHEF" | "STAFF";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  workspaceId: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
}

export interface Ingredient {
  id: string;
  name: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;

  // Satuan resep (dipakai saat menyusun resep)
  unit: "g" | "kg" | "ml" | "L" | "pcs";

  // Model harga pembelian (cara beli nyata di pasar)
  purchasePrice: number;        // harga total kemasan (Rp)
  purchaseQuantity: number;     // isi kemasan dalam satuan resep
  purchaseUnit: string;         // label kemasan: "kg", "pack", "ikat", dll.
  usableYield: number;          // % bahan terpakai setelah susut (1–100)
  costPerRecipeUnit: number;    // dihitung server-side: biaya aktual per satuan resep

  // Alias backward-compat (= costPerRecipeUnit)
  pricePerUnit: number;

  // Stok (diisi via StockPage)
  currentStock: number;
  reorderPoint: number;
}

export interface Recipe {
  id: string;
  name: string;
  yieldQuantity: number;
  yieldUnit: "portions" | "kg" | "grams";
  recipeType: "PREP" | "MENU";
  isBaseRecipe: boolean;
  sellingPrice: number;
  targetFoodCost: number;
  workspaceId: string;
  items: RecipeItem[];
  createdAt: string;
  updatedAt: string;
}

export interface RecipeItem {
  id: string;
  recipeId: string;
  ingredientId?: string; // Optional if it is a sub-recipe
  subRecipeId?: string;  // Optional if it is a raw ingredient
  quantity: number;
  unit: string;
  ingredient?: Ingredient;
  subRecipe?: Recipe;
}
