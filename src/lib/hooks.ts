import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Recipe } from './types';

export function useRecipes() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchRecipes() {
            try {
                setLoading(true);

                const { data, error } = await supabase
                    .from('recipes')
                    .select(`
                        *,
                        category:category_id(id, name, slug),
                        recipe_tags(tags(id, name)),
                        recipe_ingredients(amount_in_grams, unit, ingredients(*))
                    `)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Supabase error:', error);
                    throw error;
                }

                console.log('Fetched recipes with relations:', data);

                // Transform data to match Recipe type
                const transformedRecipes: Recipe[] = (data || []).map((recipe: any) => ({
                    ...recipe,
                    rating: recipe.rating || 3,
                    category: recipe.category || { id: 0, name: 'Uncategorized', slug: 'uncategorized', image_url: null, created_at: null },
                    tags: recipe.recipe_tags?.map((rt: any) => rt.tags).filter(Boolean) || [],
                    ingredients: recipe.recipe_ingredients?.map((ri: any) => ({
                        amount_in_grams: ri.amount_in_grams,
                        unit: ri.unit || 'g',
                        ingredient: ri.ingredients
                    })).filter((ing: any) => ing.ingredient) || [],
                }));

                setRecipes(transformedRecipes);
            } catch (err) {
                console.error('Full error:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch recipes');
            } finally {
                setLoading(false);
            }
        }

        fetchRecipes();
    }, []);

    return { recipes, loading, error };
}

export function useRecipe(id: string | undefined) {
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        async function fetchRecipe() {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('recipes')
                    .select(`
                        *,
                        category:category_id(id, name, slug),
                        recipe_tags(tags(id, name)),
                        recipe_ingredients(amount_in_grams, unit, ingredients(*))
                    `)
                    .eq('id', id)
                    .single();

                if (error) throw error;

                if (data) {
                    const transformedRecipe: Recipe = {
                        ...data,
                        rating: data.rating || 3,
                        category: data.category || { id: 0, name: 'Uncategorized', slug: 'uncategorized', image_url: null, created_at: null },
                        tags: data.recipe_tags?.map((rt: any) => rt.tags).filter(Boolean) || [],
                        ingredients: data.recipe_ingredients?.map((ri: any) => ({
                            amount_in_grams: ri.amount_in_grams,
                            unit: ri.unit || 'g',
                            ingredient: ri.ingredients
                        })).filter((ing: any) => ing.ingredient) || [],
                    };
                    setRecipe(transformedRecipe);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch recipe');
            } finally {
                setLoading(false);
            }
        }

        fetchRecipe();
    }, [id]);

    return { recipe, loading, error };
}

export function useCategories() {
    const [categories, setCategories] = useState<Array<{ id: number; name: string; slug: string; image_url: string | null; created_at: string | null }>>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCategories() {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('categories')
                    .select('*')
                    .order('name');

                if (error) throw error;
                setCategories(data || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch categories');
            } finally {
                setLoading(false);
            }
        }

        fetchCategories();
    }, []);

    return { categories, loading, error };
}
