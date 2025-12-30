import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
    DollarSign,
    TrendingUp,
    PieChart as PieChartIcon,
    ChefHat,
    ShoppingBag,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useShoppingCart } from '@/contexts/ShoppingCartContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    startOfWeek, endOfWeek,
    startOfMonth, endOfMonth,
    startOfQuarter, endOfQuarter,
    startOfYear, endOfYear,
    addWeeks, addMonths, addQuarters, addYears,
    format, isWithinInterval
} from 'date-fns';

interface IngredientStat {
    category: string;
    count: number;
    cost: number;
}

interface RecipeStat {
    title: string;
    count: number;
}

interface TagStat {
    tag: string;
    cost: number;
    recipeCount: number;
}

interface CategoryRecipeStat {
    category: string;
    recipeCount: number;
}

type Period = 'week' | 'month' | 'quarter' | 'year';

// Helper to convert "YYYY-WW" to a Date object (start of that week)
function getDateFromWeekId(weekId: string): Date {
    const [year, week] = weekId.split('-').map(Number);
    // Simple estimation: First Jan + (week-1) weeks
    const d = new Date(Date.UTC(year, 0, 4)); // 4th Jan is always in week 1
    d.setUTCDate(d.getUTCDate() + (week - 1) * 7);
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 1 - dayNum); // Adjust to Monday
    return d;
}

export default function Statistics() {
    const { cartItems } = useShoppingCart();
    const [ingredientStats, setIngredientStats] = useState<IngredientStat[]>([]);
    const [topRecipes, setTopRecipes] = useState<RecipeStat[]>([]);
    const [totalSpent, setTotalSpent] = useState(0);
    const [weeklySpend, setWeeklySpend] = useState<{ label: string, cost: number }[]>([]);
    const [tagStats, setTagStats] = useState<TagStat[]>([]);
    const [categoryRecipeStats, setCategoryRecipeStats] = useState<CategoryRecipeStat[]>([]);

    // View State
    const [period, setPeriod] = useState<Period>('month');
    const [currentDate, setCurrentDate] = useState(new Date());

    // Filter Logic
    const filteredData = useMemo(() => {
        let start: Date, end: Date;

        switch (period) {
            case 'week':
                start = startOfWeek(currentDate, { weekStartsOn: 1 });
                end = endOfWeek(currentDate, { weekStartsOn: 1 });
                break;
            case 'month':
                start = startOfMonth(currentDate);
                end = endOfMonth(currentDate);
                break;
            case 'quarter':
                start = startOfQuarter(currentDate);
                end = endOfQuarter(currentDate);
                break;
            case 'year':
                start = startOfYear(currentDate);
                end = endOfYear(currentDate);
                break;
        }

        // Filter Cart Items by Week ID falling in range
        const filteredItems = cartItems.filter(item => {
            if (!item.weekId) return false;
            const itemDate = getDateFromWeekId(item.weekId);
            return isWithinInterval(itemDate, { start, end });
        });

        return { items: filteredItems, start, end };
    }, [cartItems, period, currentDate]);

    useEffect(() => {
        calculateStats();
    }, [filteredData]);

    const handlePrev = () => {
        switch (period) {
            case 'week': setCurrentDate(d => addWeeks(d, -1)); break;
            case 'month': setCurrentDate(d => addMonths(d, -1)); break;
            case 'quarter': setCurrentDate(d => addQuarters(d, -1)); break;
            case 'year': setCurrentDate(d => addYears(d, -1)); break;
        }
    };

    const handleNext = () => {
        switch (period) {
            case 'week': setCurrentDate(d => addWeeks(d, 1)); break;
            case 'month': setCurrentDate(d => addMonths(d, 1)); break;
            case 'quarter': setCurrentDate(d => addQuarters(d, 1)); break;
            case 'year': setCurrentDate(d => addYears(d, 1)); break;
        }
    };

    const periodLabel = useMemo(() => {
        switch (period) {
            case 'week': return `Week ${format(currentDate, 'w, yyyy')}`;
            case 'month': return format(currentDate, 'MMMM yyyy');
            case 'quarter': return `Q${Math.floor(currentDate.getMonth() / 3) + 1} ${format(currentDate, 'yyyy')}`;
            case 'year': return format(currentDate, 'yyyy');
        }
    }, [period, currentDate]);

    const calculateStats = async () => {
        try {
            const { items } = filteredData;

            // 1. Calculate Total Spent for Period
            const total = items.reduce((sum, item) => sum + (item.price || 0) * item.amount, 0);
            setTotalSpent(total);

            // Chart Data (Group by sub-units)
            const chartData: Record<string, number> = {};
            items.forEach(item => {
                let key = item.weekId;
                chartData[key] = (chartData[key] || 0) + ((item.price || 0) * item.amount);
            });

            setWeeklySpend(
                Object.entries(chartData)
                    .map(([week, cost]) => ({ label: week.split('-')[1], cost }))
                    .sort((a, b) => a.label.localeCompare(b.label))
            );

            // 2. Fetch Meal Planner Stats (Filtered by Date)
            const { data: plannerData, error: plannerError } = await supabase
                .from('meal_planner')
                .select('*');

            if (plannerError) throw plannerError;

            const filteredPlanner = plannerData?.filter((p: any) => {
                const pDate = new Date(p.date);
                return isWithinInterval(pDate, { start: filteredData.start, end: filteredData.end });
            }) || [];

            const recipeCounts: Record<string, number> = {};
            filteredPlanner.forEach((item: any) => {
                recipeCounts[item.recipe_id] = (recipeCounts[item.recipe_id] || 0) + 1;
            });

            if (Object.keys(recipeCounts).length > 0) {
                const { data: recipes } = await supabase
                    .from('recipes')
                    .select('id, title')
                    .in('id', Object.keys(recipeCounts));

                const stats: RecipeStat[] = recipes?.map(r => ({
                    title: r.title,
                    count: recipeCounts[r.id]
                })).sort((a, b) => b.count - a.count).slice(0, 10) || [];

                setTopRecipes(stats);
            } else {
                setTopRecipes([]);
            }

            // 3. Ingredient Stats (Based on filtered items)
            const statsMap: Record<string, IngredientStat> = {};
            const uniqueNames = [...new Set(items.map(i => i.name))];

            if (uniqueNames.length > 0) {
                const { data: ingData } = await supabase
                    .from('ingredients')
                    .select('name, category, estimated_cost')
                    .in('name', uniqueNames);

                items.forEach(item => {
                    const ingInfo = ingData?.find(d => d.name === item.name);
                    const category = ingInfo?.category || 'Other';

                    if (!statsMap[category]) {
                        statsMap[category] = { category, count: 0, cost: 0 };
                    }
                    statsMap[category].count += 1;
                    statsMap[category].cost += (item.price || ingInfo?.estimated_cost || 0) * item.amount;
                });
            }
            setIngredientStats(Object.values(statsMap).sort((a, b) => b.cost - a.cost));

            // 4. Tag-Based Analytics
            const tagStatsMap: Record<string, TagStat> = {
                'Meat': { tag: 'Meat', cost: 0, recipeCount: 0 },
                'Chicken': { tag: 'Chicken', cost: 0, recipeCount: 0 },
                'Fish': { tag: 'Fish', cost: 0, recipeCount: 0 },
                'Rice': { tag: 'Rice', cost: 0, recipeCount: 0 },
                'Other': { tag: 'Other', cost: 0, recipeCount: 0 } // Anything not Meat/Chicken/Fish/Rice
            };

            // Get unique recipe IDs from cart items
            const recipeIdsInCart = [...new Set(items.flatMap(i => i.recipeIds))].filter(Boolean);

            if (recipeIdsInCart.length > 0) {
                const { data: recipeTags } = await supabase
                    .from('recipe_tags')
                    .select('recipe_id, tags(name)')
                    .in('recipe_id', recipeIdsInCart);

                // Map recipe IDs to their tags
                const recipeTagMap: Record<string, string> = {};
                recipeTags?.forEach((rt: any) => {
                    const tagName = rt.tags?.name;
                    if (tagName && ['Meat', 'Chicken', 'Fish', 'Rice', 'Other'].includes(tagName)) {
                        recipeTagMap[rt.recipe_id] = tagName;
                    }
                });

                // Calculate cost per tag
                items.forEach(item => {
                    item.recipeIds.forEach(recipeId => {
                        const tag = recipeTagMap[recipeId] || 'Other';
                        tagStatsMap[tag].cost += (item.price || 0) * item.amount;
                    });
                });

                // Calculate recipe count per tag from meal planner
                filteredPlanner.forEach((p: any) => {
                    const tag = recipeTagMap[p.recipe_id] || 'Other';
                    if (tagStatsMap[tag]) {
                        tagStatsMap[tag].recipeCount += 1;
                    }
                });
            }

            setTagStats(Object.values(tagStatsMap).filter(t => t.cost > 0 || t.recipeCount > 0));

            // 5. Category Recipe Usage
            const categoryRecipeMap: Record<string, number> = {};

            if (filteredPlanner.length > 0) {
                const recipeIds = [...new Set(filteredPlanner.map((p: any) => p.recipe_id))];
                const { data: recipesWithCategories } = await supabase
                    .from('recipes')
                    .select('id, category:category_id(name)')
                    .in('id', recipeIds);

                filteredPlanner.forEach((p: any) => {
                    const recipe = recipesWithCategories?.find((r: any) => r.id === p.recipe_id);
                    const cat = (recipe as any)?.category;
                    const categoryName = (Array.isArray(cat) ? cat[0]?.name : cat?.name) || 'Uncategorized';
                    categoryRecipeMap[categoryName] = (categoryRecipeMap[categoryName] || 0) + 1;
                });
            }

            setCategoryRecipeStats(
                Object.entries(categoryRecipeMap)
                    .map(([category, recipeCount]) => ({ category, recipeCount }))
                    .sort((a, b) => b.recipeCount - a.recipeCount)
            );

        } catch (error) {
            console.error("Error calculating stats:", error);
        }
    };

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariant = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-24">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
                        Kitchen Analytics
                    </h1>
                    <p className="text-gray-500 font-medium">Insights into your culinary journey</p>
                </motion.div>

                {/* Controls */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 bg-white p-4 rounded-3xl shadow-sm border border-gray-100"
                >
                    {/* Period Selector */}
                    <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                        {(['week', 'month', 'quarter', 'year'] as Period[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${period === p
                                    ? 'bg-white text-gray-900 shadow-md transform scale-105'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center gap-6">
                        <button onClick={handlePrev} className="p-3 hover:bg-gray-50 rounded-full transition-colors text-gray-400 hover:text-primary-600">
                            <ChevronLeft size={24} strokeWidth={3} />
                        </button>

                        <div className="text-center min-w-[200px]">
                            <h2 className="text-2xl font-black text-gray-900 leading-none">{periodLabel}</h2>
                        </div>

                        <button onClick={handleNext} className="p-3 hover:bg-gray-50 rounded-full transition-colors text-gray-400 hover:text-primary-600">
                            <ChevronRight size={24} strokeWidth={3} />
                        </button>
                    </div>
                </motion.div>

                <AnimatePresence mode='wait'>
                    <motion.div
                        key={period + periodLabel} // Re-animate on period change
                        variants={container}
                        initial="hidden"
                        animate="show"
                        exit={{ opacity: 0 }}
                        className="space-y-8"
                    >
                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <motion.div variants={itemVariant} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-xl transition-all duration-500">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                                <div className="relative">
                                    <div className="p-3 bg-green-100 w-fit rounded-2xl text-green-600 mb-4">
                                        <DollarSign size={24} strokeWidth={2.5} />
                                    </div>
                                    <h3 className="text-4xl font-black text-gray-900 tracking-tight mb-1">
                                        ${totalSpent.toFixed(0)}
                                    </h3>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total Cost</p>
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariant} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-xl transition-all duration-500">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                                <div className="relative">
                                    <div className="p-3 bg-blue-100 w-fit rounded-2xl text-blue-600 mb-4">
                                        <ChefHat size={24} strokeWidth={2.5} />
                                    </div>
                                    <h3 className="text-4xl font-black text-gray-900 tracking-tight mb-1">
                                        {topRecipes.reduce((a, b) => a + b.count, 0)}
                                    </h3>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Meals Planned</p>
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariant} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-xl transition-all duration-500">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                                <div className="relative">
                                    <div className="p-3 bg-purple-100 w-fit rounded-2xl text-purple-600 mb-4">
                                        <ShoppingBag size={24} strokeWidth={2.5} />
                                    </div>
                                    <h3 className="text-4xl font-black text-gray-900 tracking-tight mb-1">
                                        {ingredientStats.length}
                                    </h3>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Categories</p>
                                </div>
                            </motion.div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Spending Chart */}
                            <motion.div variants={itemVariant} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-xl font-black text-gray-900">Spending Trends</h2>
                                        <p className="text-sm text-gray-400 font-bold mt-1">Cost distribution over {period}</p>
                                    </div>
                                    <div className="p-2 bg-gray-50 rounded-xl text-gray-400">
                                        <TrendingUp size={20} />
                                    </div>
                                </div>

                                <div className="h-64 flex items-end justify-between gap-4">
                                    {weeklySpend.length === 0 ? (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300 font-medium">
                                            No spending data for this period
                                        </div>
                                    ) : (
                                        weeklySpend.map((data, idx) => (
                                            <div key={idx} className="flex-1 flex flex-col items-center gap-3 group">
                                                <div className="w-full bg-gray-100 rounded-2xl relative overflow-hidden h-full flex items-end">
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${Math.min((data.cost / (Math.max(...weeklySpend.map(w => w.cost)) || 1)) * 100, 100)}%` }}
                                                        transition={{ duration: 1, delay: idx * 0.1 }}
                                                        className="w-full bg-gray-900 rounded-2xl opacity-80 group-hover:opacity-100 transition-opacity"
                                                    />
                                                </div>
                                                <div className="text-center">
                                                    <span className="block text-xs font-bold text-gray-900 mb-1">${data.cost.toFixed(0)}</span>
                                                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">W{data.label}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>

                            {/* Top Recipes */}
                            <motion.div variants={itemVariant} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-xl font-black text-gray-900">Favorite Meals</h2>
                                        <p className="text-sm text-gray-400 font-bold mt-1">Most planned in this period</p>
                                    </div>
                                    <div className="p-2 bg-gray-50 rounded-xl text-gray-400">
                                        <ChefHat size={20} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {topRecipes.length === 0 ? (
                                        <div className="p-8 text-center text-gray-300 font-medium">
                                            No meals planned in this period.
                                        </div>
                                    ) : (
                                        topRecipes.map((recipe, idx) => (
                                            <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors group">
                                                <span className="text-2xl font-black text-gray-200 group-hover:text-primary-200 transition-colors">
                                                    0{idx + 1}
                                                </span>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-gray-900">{recipe.title}</h4>
                                                    <div className="h-1.5 w-full bg-gray-100 rounded-full mt-2 overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(recipe.count / topRecipes[0].count) * 100}%` }}
                                                            transition={{ duration: 0.8, delay: 0.2 + (idx * 0.1) }}
                                                            className="h-full bg-primary-500 rounded-full"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-lg font-black text-gray-900">{recipe.count}</span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Times</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        {/* Ingredient Breakdown */}
                        <motion.div variants={itemVariant} className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-xl overflow-hidden relative">
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-xl font-black text-white">Category Breakdown</h2>
                                        <p className="text-sm text-gray-400 font-bold mt-1">Cost distribution by ingredient type</p>
                                    </div>
                                    <div className="p-2 bg-white/10 rounded-xl text-white">
                                        <PieChartIcon size={20} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {ingredientStats.map((stat, idx) => (
                                        <div key={idx} className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="h-2 w-2 rounded-full bg-primary-500" />
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{Math.round((stat.cost / (totalSpent || 1)) * 100)}%</span>
                                            </div>
                                            <h4 className="text-lg font-bold text-white mb-1">{stat.category}</h4>
                                            <p className="text-sm font-medium text-gray-400">${stat.cost.toFixed(2)}</p>
                                        </div>
                                    ))}
                                    {ingredientStats.length === 0 && (
                                        <div className="col-span-4 text-center py-8 text-gray-500">
                                            No ingredient data available for this period.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Decorative background blobs */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/20 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/20 blur-[80px] rounded-full -ml-32 -mb-32 pointer-events-none" />
                        </motion.div>

                        {/* Tag-Based Analytics */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Cost by Recipe Tags */}
                            <motion.div variants={itemVariant} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-xl font-black text-gray-900">Cost by Recipe Type</h2>
                                        <p className="text-sm text-gray-400 font-bold mt-1">Spending distribution by tags</p>
                                    </div>
                                    <div className="p-2 bg-gray-50 rounded-xl text-gray-400">
                                        <DollarSign size={20} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {tagStats.length === 0 ? (
                                        <div className="p-8 text-center text-gray-300 font-medium">
                                            No tag data available for this period.
                                        </div>
                                    ) : (
                                        tagStats.map((stat, idx) => {
                                            const maxCost = Math.max(...tagStats.map(t => t.cost));
                                            const percentage = maxCost > 0 ? (stat.cost / maxCost) * 100 : 0;
                                            const colors = {
                                                'Meat': 'bg-red-500',
                                                'Chicken': 'bg-yellow-500',
                                                'Fish': 'bg-blue-500',
                                                'Rice': 'bg-green-500',
                                                'Other': 'bg-gray-500'
                                            };
                                            return (
                                                <div key={idx} className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold text-gray-900">{stat.tag}</span>
                                                        <span className="text-sm font-black text-gray-600">${stat.cost.toFixed(2)}</span>
                                                    </div>
                                                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${percentage}%` }}
                                                            transition={{ duration: 0.8, delay: idx * 0.1 }}
                                                            className={`h-full ${colors[stat.tag as keyof typeof colors] || 'bg-gray-500'} rounded-full`}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </motion.div>

                            {/* Recipe Usage by Tags */}
                            <motion.div variants={itemVariant} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-xl font-black text-gray-900">Meals by Recipe Type</h2>
                                        <p className="text-sm text-gray-400 font-bold mt-1">Recipe usage by tags</p>
                                    </div>
                                    <div className="p-2 bg-gray-50 rounded-xl text-gray-400">
                                        <ChefHat size={20} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {tagStats.length === 0 ? (
                                        <div className="p-8 text-center text-gray-300 font-medium">
                                            No tag data available for this period.
                                        </div>
                                    ) : (
                                        tagStats.map((stat, idx) => {
                                            const maxCount = Math.max(...tagStats.map(t => t.recipeCount));
                                            const percentage = maxCount > 0 ? (stat.recipeCount / maxCount) * 100 : 0;
                                            const colors = {
                                                'Meat': 'bg-red-500',
                                                'Chicken': 'bg-yellow-500',
                                                'Fish': 'bg-blue-500',
                                                'Rice': 'bg-green-500',
                                                'Other': 'bg-gray-500'
                                            };
                                            return (
                                                <div key={idx} className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold text-gray-900">{stat.tag}</span>
                                                        <span className="text-sm font-black text-gray-600">{stat.recipeCount} meals</span>
                                                    </div>
                                                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${percentage}%` }}
                                                            transition={{ duration: 0.8, delay: idx * 0.1 }}
                                                            className={`h-full ${colors[stat.tag as keyof typeof colors] || 'bg-gray-500'} rounded-full`}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        {/* Category Recipe Usage */}
                        <motion.div variants={itemVariant} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-xl font-black text-gray-900">Meals by Category</h2>
                                    <p className="text-sm text-gray-400 font-bold mt-1">Recipe usage distribution</p>
                                </div>
                                <div className="p-2 bg-gray-50 rounded-xl text-gray-400">
                                    <PieChartIcon size={20} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {categoryRecipeStats.length === 0 ? (
                                    <div className="col-span-full p-8 text-center text-gray-300 font-medium">
                                        No category data available for this period.
                                    </div>
                                ) : (
                                    categoryRecipeStats.map((stat, idx) => (
                                        <div key={idx} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="h-2 w-2 rounded-full bg-primary-500" />
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                    {Math.round((stat.recipeCount / categoryRecipeStats.reduce((a, b) => a + b.recipeCount, 0)) * 100)}%
                                                </span>
                                            </div>
                                            <h4 className="text-lg font-bold text-gray-900 mb-1">{stat.category}</h4>
                                            <p className="text-sm font-medium text-gray-400">{stat.recipeCount} meals</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
