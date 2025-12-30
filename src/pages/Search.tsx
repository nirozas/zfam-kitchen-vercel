import { useSearchParams } from 'react-router-dom';
import { useRecipes, useTopTags } from '@/lib/hooks';
import RecipeCard from '@/components/RecipeCard';
import { Search as SearchIcon, Frown, Hash } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Search() {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const { recipes, loading, error } = useRecipes();
    const { tags: topTags } = useTopTags(12);

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

    const handleTagClick = (tagName: string) => {
        setSearchParams({ q: tagName });
    };

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
            <div className="container mx-auto px-4 max-w-[1800px]">
                <header className="mb-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-8 border-b border-gray-100">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-primary-500 p-2 rounded-xl text-white shadow-lg shadow-primary-200">
                                    <SearchIcon size={24} />
                                </div>
                                <h1 className="text-4xl font-black text-gray-900 font-display tracking-tight">
                                    {query ? `Results for "${query}"` : 'All Recipes'}
                                </h1>
                            </div>
                            <p className="text-gray-500 font-medium">
                                {filteredRecipes.length} {filteredRecipes.length === 1 ? 'recipe' : 'recipes'} waiting for you
                            </p>
                        </div>

                        {/* Top Hashtags */}
                        {topTags.length > 0 && (
                            <div className="flex flex-wrap gap-2 max-w-2xl">
                                {topTags.map((tag) => (
                                    <button
                                        key={tag.name}
                                        onClick={() => handleTagClick(tag.name)}
                                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-1.5 ${query.toLowerCase() === tag.name.toLowerCase()
                                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
                                            : 'bg-white text-gray-600 hover:bg-primary-50 hover:text-primary-600 border border-gray-100'
                                            }`}
                                    >
                                        <Hash size={14} className={query.toLowerCase() === tag.name.toLowerCase() ? 'text-white' : 'text-primary-400'} />
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </header>

                {filteredRecipes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-8">
                        {filteredRecipes.map((recipe) => (
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
                            We couldn't find any recipes matching your search. Try different keywords or browse our categories.
                        </p>
                        <button
                            onClick={() => setSearchParams({})}
                            className="inline-flex items-center justify-center px-8 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200"
                        >
                            View All Recipes
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
