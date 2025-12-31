import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Recipe, PlannerMeal } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface MealPlannerContextType {
    plannedMeals: Record<string, PlannerMeal[]>;
<<<<<<< HEAD
    dailyNotes: Record<string, string>;
    addRecipeToDate: (recipe: Recipe, dateStr: string) => void;
    addCustomMealToDate: (title: string, dateStr: string) => void;
    removeRecipeFromDate: (dateStr: string, index: number) => void;
    saveDailyNote: (dateStr: string, note: string) => Promise<void>;
=======
    addRecipeToDate: (recipe: Recipe, dateStr: string) => void;
    addCustomMealToDate: (title: string, dateStr: string) => void;
    removeRecipeFromDate: (dateStr: string, index: number) => void;
>>>>>>> 74eac4e67b2e2bf59a1c6949a574bf67269fc1fa
    loading: boolean;
}

const MealPlannerContext = createContext<MealPlannerContextType | undefined>(undefined);

export const MealPlannerProvider = ({ children }: { children: ReactNode }) => {
    const [plannedMeals, setPlannedMeals] = useState<Record<string, PlannerMeal[]>>({});
<<<<<<< HEAD
    const [dailyNotes, setDailyNotes] = useState<Record<string, string>>({});
=======
>>>>>>> 74eac4e67b2e2bf59a1c6949a574bf67269fc1fa
    const [loading, setLoading] = useState(true);

    // Load from Supabase on mount or auth change
    useEffect(() => {
        const fetchMealPlan = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setPlannedMeals({});
<<<<<<< HEAD
                setDailyNotes({});
=======
>>>>>>> 74eac4e67b2e2bf59a1c6949a574bf67269fc1fa
                setLoading(false);
                return;
            }

<<<<<<< HEAD
            const [mealsResult, notesResult] = await Promise.all([
                supabase
                    .from('meal_planner')
                    .select('*, recipes(*, categories(*), recipe_ingredients(*, ingredients(*)), recipe_tags(*, tags(*)))')
                    .eq('user_id', user.id)
                    .order('id', { ascending: true }),
                supabase
                    .from('daily_notes')
                    .select('date, note')
                    .eq('user_id', user.id)
            ]);

            if (mealsResult.error) {
                console.error('Error fetching meal plan:', mealsResult.error);
            } else if (mealsResult.data) {
                const grouped: Record<string, PlannerMeal[]> = {};
                mealsResult.data.forEach((item: any) => {
=======
            const { data, error } = await supabase
                .from('meal_planner')
                .select('*, recipes(*, categories(*), recipe_ingredients(*, ingredients(*)), recipe_tags(*, tags(*)))')
                .eq('user_id', user.id)
                .order('id', { ascending: true });

            if (error) {
                console.error('Error fetching meal plan:', error);
            } else if (data) {
                const grouped: Record<string, PlannerMeal[]> = {};
                data.forEach((item: any) => {
>>>>>>> 74eac4e67b2e2bf59a1c6949a574bf67269fc1fa
                    const date = item.date;
                    if (!grouped[date]) grouped[date] = [];

                    if (item.custom_title) {
                        grouped[date].push({
                            id: item.id,
                            title: item.custom_title,
                            isCustom: true
                        });
                    } else if (item.recipes) {
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

                        grouped[date].push({
                            id: recipe.id,
                            title: recipe.title,
                            image_url: recipe.image_url || undefined,
                            recipe: recipe
                        });
                    }
                });
                setPlannedMeals(grouped);
            }
<<<<<<< HEAD

            if (notesResult.error) {
                console.error('Error fetching notes:', notesResult.error);
            } else if (notesResult.data) {
                const notesMap: Record<string, string> = {};
                notesResult.data.forEach((item: any) => {
                    notesMap[item.date] = item.note;
                });
                setDailyNotes(notesMap);
            }

=======
>>>>>>> 74eac4e67b2e2bf59a1c6949a574bf67269fc1fa
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
            [dateStr]: [...(prev[dateStr] || []), {
                id: recipe.id,
                title: recipe.title,
                image_url: recipe.image_url || undefined,
                recipe: recipe
            }]
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
        }
    };

    const addCustomMealToDate = async (title: string, dateStr: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Optimistic update
        const tempId = Date.now();
        setPlannedMeals(prev => ({
            ...prev,
            [dateStr]: [...(prev[dateStr] || []), {
                id: tempId,
                title: title,
                isCustom: true
            }]
        }));

        const { error } = await supabase
            .from('meal_planner')
            .insert({
                user_id: user.id,
                custom_title: title,
                date: dateStr
            });

        if (error) {
            console.error('Error saving custom meal to planner:', error);
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

        // Delete from DB
        const matchCriteria: any = {
            user_id: user.id,
            date: dateStr
        };

        if (recipeToRemove.isCustom) {
            matchCriteria.custom_title = recipeToRemove.title;
        } else {
            matchCriteria.recipe_id = recipeToRemove.id;
        }

        const { error } = await supabase
            .from('meal_planner')
            .delete()
            .match(matchCriteria);

        if (error) {
            console.error('Error removing meal from planner:', error);
        }
    };

<<<<<<< HEAD
    const saveDailyNote = async (dateStr: string, note: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Optimistic
        setDailyNotes(prev => ({ ...prev, [dateStr]: note }));

        if (!note.trim()) {
            // Delete if empty
            await supabase.from('daily_notes').delete().match({ user_id: user.id, date: dateStr });
        } else {
            // Upsert
            const { error } = await supabase.from('daily_notes').upsert({
                user_id: user.id,
                date: dateStr,
                note: note.trim()
            }, { onConflict: 'user_id,date' });

            if (error) console.error('Error saving note:', error);
        }
    };

    return (
        <MealPlannerContext.Provider value={{ plannedMeals, dailyNotes, addRecipeToDate, addCustomMealToDate, removeRecipeFromDate, saveDailyNote, loading }}>
=======
    return (
        <MealPlannerContext.Provider value={{ plannedMeals, addRecipeToDate, addCustomMealToDate, removeRecipeFromDate, loading }}>
>>>>>>> 74eac4e67b2e2bf59a1c6949a574bf67269fc1fa
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
