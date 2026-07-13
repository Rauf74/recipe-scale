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
  unit: "g" | "kg" | "ml" | "L" | "pcs";
  pricePerUnit: number;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Recipe {
  id: string;
  name: string;
  yieldQuantity: number;
  yieldUnit: "portions" | "kg" | "grams";
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
