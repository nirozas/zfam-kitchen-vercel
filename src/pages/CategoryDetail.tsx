import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useRecipes, useCategories, useTopTags } from '@/lib/hooks';
import RecipeCard from '@/components/RecipeCard';
import { ArrowLeft, Frown, ChefHat, Plus, Hash } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CategoryDetail() {
    const { id } = useParams<{ id: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const tagQuery = searchParams.get('q') || '';

    const { recipes, loading: recipesLoading, error: recipesError } = useRecipes();
    const { categories, loading: categoriesLoading } = useCategories();
    const { tags: topTags } = useTopTags(12);

    const categoryId = id ? parseInt(id, 10) : null;
    const category = categories.find(c => c.id === categoryId);

    // Filter recipes by category ID and optionally by tag
    const categoryRecipes = recipes.filter(recipe => {
        const matchesCategory = recipe.category && recipe.category.id === categoryId;
        const matchesTag = !tagQuery || recipe.tags?.some(tag => tag.name.toLowerCase() === tagQuery.toLowerCase());
        return matchesCategory && matchesTag;
    });

    const handleTagClick = (tagName: string) => {
        if (tagQuery.toLowerCase() === tagName.toLowerCase()) {
            setSearchParams({});
        } else {
            setSearchParams({ q: tagName });
        }
    };

    const loading = recipesLoading || categoriesLoading;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading category...</p>
                </div>
            </div>
        );
    }

    if (recipesError || !category) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md p-6 bg-red-50 rounded-2xl border border-red-100">
                    <h2 className="text-xl font-bold text-red-600 mb-2">Category Not Found</h2>
                    <p className="text-gray-600 mb-6">
                        {recipesError || "The category you are looking for does not exist."}
                    </p>
                    <Link to="/categories" className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Categories
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-100">
                <div className="container mx-auto px-4 py-12 max-w-[1800px]">
                    <div className="flex items-center justify-between mb-8">
                        <Link to="/categories" className="inline-flex items-center text-gray-500 hover:text-primary-600 transition-colors font-bold uppercase text-xs tracking-widest">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Categories
                        </Link>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                        {/* Category Image */}
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] overflow-hidden bg-gray-50 border-4 border-white shadow-xl shrink-0">
                            {category.image_url ? (
                                <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-200 bg-gray-50">
                                    <ChefHat size={48} />
                                </div>
                            )}
                        </div>

                        {/* Category Info */}
                        <div className="flex-1 text-center md:text-left pt-2">
                            <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-3 font-display tracking-tighter">
                                {category.name}
                            </h1>
                            <div className="flex items-center justify-center md:justify-start gap-4">
                                <span className="px-4 py-1.5 bg-gray-100 rounded-full text-sm font-black text-gray-500 uppercase tracking-wider">
                                    {categoryRecipes.length} {categoryRecipes.length === 1 ? 'recipe' : 'recipes'}
                                </span>
                                {tagQuery && (
                                    <button
                                        onClick={() => setSearchParams({})}
                                        className="text-xs font-black text-primary-600 uppercase tracking-widest hover:underline"
                                    >
                                        Clear Filter: #{tagQuery}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Add Recipe Button */}
                        <div className="flex flex-col gap-4">
                            <Link
                                to={`/create?category=${categoryId}`}
                                className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-primary-600 transition-all shadow-xl shadow-gray-200 shrink-0 hover:-translate-y-1"
                            >
                                <Plus size={20} />
                                Add Recipe
                            </Link>
                        </div>
                    </div>

                    {/* Top Hashtags for filtering within category */}
                    {topTags.length > 0 && (
                        <div className="mt-12 pt-8 border-t border-gray-50">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Filter by Theme</label>
                            <div className="flex flex-wrap gap-2">
                                {topTags.map((tag) => (
                                    <button
                                        key={tag.name}
                                        onClick={() => handleTagClick(tag.name)}
                                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${tagQuery.toLowerCase() === tag.name.toLowerCase()
                                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
                                            : 'bg-white text-gray-600 hover:bg-primary-50 hover:text-primary-600 border border-gray-100'
                                            }`}
                                    >
                                        <Hash size={12} className={tagQuery.toLowerCase() === tag.name.toLowerCase() ? 'text-white' : 'text-primary-400'} />
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Recipes Grid */}
            <div className="container mx-auto px-4 py-12 max-w-[1800px]">
                {categoryRecipes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-8">
                        {categoryRecipes.map((recipe) => (
                            <RecipeCard key={recipe.id} recipe={recipe} />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-24 bg-white rounded-[3rem] border border-gray-100 shadow-sm"
                    >
                        <div className="mb-6 inline-flex p-8 bg-gray-50 rounded-full text-gray-400">
                            <Frown size={64} />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-2">No recipes found</h2>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto font-medium">
                            {tagQuery
                                ? `We couldn't find any recipes in this category tagged with #${tagQuery}.`
                                : "We haven't added any recipes to this category yet."}
                        </p>
                        <div className="flex justify-center gap-4">
                            {tagQuery && (
                                <button onClick={() => setSearchParams({})} className="px-8 py-3 bg-white text-gray-900 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-all">
                                    Clear Tag Filter
                                </button>
                            )}
                            <Link to={`/create?category=${categoryId}`} className="inline-flex items-center justify-center px-8 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200">
                                <Plus size={20} className="mr-2" />
                                Add a Recipe
                            </Link>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
