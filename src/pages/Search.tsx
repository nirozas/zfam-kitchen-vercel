import { useSearchParams } from 'react-router-dom';
import { useRecipes } from '@/lib/hooks';
import RecipeCard from '@/components/RecipeCard';
import { Search as SearchIcon, Frown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Search() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const { recipes, loading, error } = useRecipes();

    const filteredRecipes = recipes.filter(recipe => {
        if (!query) return true;
        const searchTerms = query.toLowerCase();
        return (
            recipe.title.toLowerCase().includes(searchTerms) ||
            recipe.description?.toLowerCase().includes(searchTerms) ||
            recipe.category?.name.toLowerCase().includes(searchTerms) ||
            recipe.tags?.some(tag => tag.name.toLowerCase().includes(searchTerms)) ||
            recipe.ingredients?.some(ing => ing.ingredient.name.toLowerCase().includes(searchTerms))
        );
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Searching recipes...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md p-6 bg-red-50 rounded-2xl border border-red-100">
                    <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
                    <p className="text-red-500">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 py-12">
            <div className="container mx-auto px-4 max-w-7xl">
                <header className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-primary-500 p-2 rounded-xl text-white shadow-lg shadow-primary-200">
                            <SearchIcon size={24} />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 font-display">
                            {query ? `Search results for "${query}"` : 'All Recipes'}
                        </h1>
                    </div>
                    <p className="text-gray-500">
                        {filteredRecipes.length} {filteredRecipes.length === 1 ? 'recipe' : 'recipes'} found
                    </p>
                </header>

                {filteredRecipes.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredRecipes.map((recipe) => (
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
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No recipes found</h2>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                            We couldn't find any recipes matching your search. Try different keywords or browse our categories.
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
