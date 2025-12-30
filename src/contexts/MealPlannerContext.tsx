import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Recipe } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface MealPlannerContextType {
    plannedMeals: Record<string, Recipe[]>;
    addRecipeToDate: (recipe: Recipe, dateStr: string) => void;
    removeRecipeFromDate: (dateStr: string, index: number) => void;
    loading: boolean;
}

const MealPlannerContext = createContext<MealPlannerContextType | undefined>(undefined);

export const MealPlannerProvider = ({ children }: { children: ReactNode }) => {
    const [plannedMeals, setPlannedMeals] = useState<Record<string, Recipe[]>>({});
    const [loading, setLoading] = useState(true);

    // Load from Supabase on mount or auth change
    useEffect(() => {
        const fetchMealPlan = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setPlannedMeals({});
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('meal_planner')
                .select('*, recipes(*, categories(*), recipe_ingredients(*, ingredients(*)), recipe_tags(*, tags(*)))')
                .eq('user_id', user.id);

            if (error) {
                console.error('Error fetching meal plan:', error);
            } else if (data) {
                const grouped: Record<string, Recipe[]> = {};
                data.forEach((item: any) => {
                    const date = item.date;
                    if (!grouped[date]) grouped[date] = [];

                    // Transform database recipe object to match UI Recipe interface
                    const rawRecipe = item.recipes;
                    const recipe: Recipe = {
                        ...rawRecipe,
                        ingredients: rawRecipe.recipe_ingredients.map((ri: any) => ({
                            ingredient: ri.ingredients,
                            amount_in_grams: ri.amount_in_grams,
                            unit: ri.unit
                        })),
                        category: rawRecipe.categories,
                        tags: rawRecipe.recipe_tags.map((rt: any) => rt.tags)
                    };

                    grouped[date].push(recipe);
                });
                setPlannedMeals(grouped);
            }
            setLoading(false);
        };

        fetchMealPlan();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchMealPlan();
        });

        return () => subscription.unsubscribe();
    }, []);

    const addRecipeToDate = async (recipe: Recipe, dateStr: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Optimistic update
        setPlannedMeals(prev => ({
            ...prev,
            [dateStr]: [...(prev[dateStr] || []), recipe]
        }));

        const { error } = await supabase
            .from('meal_planner')
            .insert({
                user_id: user.id,
                recipe_id: recipe.id,
                date: dateStr
            });

        if (error) {
            console.error('Error saving meal to planner:', error);
            // Revert on error? Or just log.
        }
    };

    const removeRecipeFromDate = async (dateStr: string, index: number) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const recipeToRemove = plannedMeals[dateStr][index];

        // Optimistic update
        setPlannedMeals(prev => {
            const newMeals = [...(prev[dateStr] || [])];
            newMeals.splice(index, 1);
            return {
                ...prev,
                [dateStr]: newMeals
            };
        });

        // Delete from DB. Note: Since we don't have the specific ID of the row easily, 
        // we delete by date and recipe_id. If there are duplicates, this might delete both.
        // But the unique constraint in SQL is (user_id, recipe_id, date), so there's only one.
        const { error } = await supabase
            .from('meal_planner')
            .delete()
            .match({
                user_id: user.id,
                recipe_id: recipeToRemove.id,
                date: dateStr
            });

        if (error) {
            console.error('Error removing meal from planner:', error);
        }
    };

    return (
        <MealPlannerContext.Provider value={{ plannedMeals, addRecipeToDate, removeRecipeFromDate, loading }}>
            {children}
        </MealPlannerContext.Provider>
    );
};

export const useMealPlanner = () => {
    const context = useContext(MealPlannerContext);
    if (!context) {
        throw new Error('useMealPlanner must be used within a MealPlannerProvider');
    }
    return context;
};
