import { useParams, Link } from 'react-router-dom';
import { useRecipes, useCategories } from '@/lib/hooks';
import RecipeCard from '@/components/RecipeCard';
import { ArrowLeft, Frown, ChefHat } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CategoryDetail() {
    const { id } = useParams<{ id: string }>();
    const { recipes, loading: recipesLoading, error: recipesError } = useRecipes();
    const { categories, loading: categoriesLoading } = useCategories();

    const categoryId = id ? parseInt(id, 10) : null;
    const category = categories.find(c => c.id === categoryId);

    // Filter recipes by category ID
    // Note: recipe.category is an object joined by Supabase, so we check recipe.category.id
    const categoryRecipes = recipes.filter(recipe =>
        recipe.category && recipe.category.id === categoryId
    );

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
                <div className="container mx-auto px-4 py-12 max-w-7xl">
                    <Link to="/categories" className="inline-flex items-center text-gray-500 hover:text-primary-600 mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Categories
                    </Link>

                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                        {/* Category Image */}
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl overflow-hidden bg-gray-100 shadow-lg shrink-0">
                            {category.image_url ? (
                                <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <ChefHat size={48} />
                                </div>
                            )}
                        </div>

                        {/* Category Info */}
                        <div className="text-center md:text-left">
                            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-2 font-display">
                                {category.name}
                            </h1>
                            <p className="text-xl text-gray-500 font-medium">
                                {categoryRecipes.length} {categoryRecipes.length === 1 ? 'recipe' : 'recipes'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recipes Grid */}
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                {categoryRecipes.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {categoryRecipes.map((recipe) => (
                            <RecipeCard key={recipe.id} recipe={recipe} />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm"
                    >
                        <div className="mb-6 inline-flex p-6 bg-gray-50 rounded-full text-gray-400">
                            <Frown size={48} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No recipes yet</h2>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                            We haven't added any recipes to this category yet. unexpected? Try refreshing or check back later.
                        </p>
                        <Link to="/create" className="inline-flex items-center justify-center px-8 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200">
                            Add a Recipe
                        </Link>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
