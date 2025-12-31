import { Recipe } from '@/lib/types';
import { Clock, Flame, Star, ShoppingCart, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useShoppingCart, getCurrentWeekId } from '@/contexts/ShoppingCartContext';
import { useFavorites, useLikes, useRecipeLikes } from '@/lib/hooks';

interface RecipeCardProps {
    recipe: Recipe;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
    const { cartItems, addToCart } = useShoppingCart();
    const { favorites, toggleFavorite } = useFavorites();
    const { likes, toggleLike } = useLikes();
    const { count: likesCount, fetchCount: fetchLikesCount } = useRecipeLikes(recipe.id);

    // Check if any items from this recipe are in the cart
    const isInCart = cartItems.some(item => item.recipeIds.includes(recipe.id));

    const isFavorited = favorites.includes(recipe.id);
    const isLiked = likes.includes(recipe.id);

    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(recipe.id);
    };

    const handleToggleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        await toggleLike(recipe.id);
        fetchLikesCount();
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const currentWeekId = getCurrentWeekId();
        recipe.ingredients.forEach((item) => {
            addToCart({
                name: item.ingredient.name,
                amount: item.amount_in_grams,
                unit: item.unit || 'g',
                recipeId: recipe.id,
                recipeName: recipe.title,
                weekId: currentWeekId,
            });
        });
        alert(`All ingredients for ${recipe.title} added to cart!`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
            className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 relative"
        >
            <Link to={`/recipe/${recipe.id}`} className="block">
                <div className="aspect-[3/2] overflow-hidden relative bg-gray-100 flex items-center justify-center">
                    {recipe.image_url ? (
                        <img
                            src={recipe.image_url}
                            alt={recipe.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <span className="text-4xl text-gray-300">🍽️</span>
                    )}
                    <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-xs font-semibold text-primary-700 shadow-sm border border-primary-100">
                            {recipe.category?.name || 'Recipe'}
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                        <button
                            onClick={handleToggleLike}
                            className={`p-2 rounded-full backdrop-blur-md transition-all duration-300 shadow-sm border ${isLiked
                                ? 'bg-rose-500 text-white border-rose-400'
                                : 'bg-white/90 text-gray-400 border-gray-100 hover:bg-white hover:text-rose-500'
                                }`}
                            title={isLiked ? "Unlike" : "Like"}
                        >
                            <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
                        </button>
                        <button
                            onClick={handleToggleFavorite}
                            className={`p-2 rounded-full backdrop-blur-md transition-all duration-300 shadow-sm border ${isFavorited
                                    ? 'bg-amber-500 text-white border-amber-400'
                                    : 'bg-white/90 text-gray-400 border-gray-100 hover:bg-white hover:text-amber-500'
                                }`}
                            title={isFavorited ? "Remove from favorites" : "Favorite this recipe"}
                        >
                            <Star size={16} fill={isFavorited ? "currentColor" : "none"} />
                        </button>
                        <button
                            onClick={handleAddToCart}
                            className={`p-2 rounded-full backdrop-blur-md transition-all duration-300 shadow-sm border ${isInCart
                                ? 'bg-green-500 text-white border-green-400'
                                : 'bg-white/90 text-gray-600 border-gray-100 hover:bg-white hover:text-primary-600'
                                }`}
                            title={isInCart ? "Already in cart" : "Add all ingredients to cart"}
                        >
                            <ShoppingCart size={16} />
                        </button>
                    </div>
                </div>

                <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-yellow-500">
                                <Star size={14} fill="currentColor" />
                                <span className="text-sm font-bold text-gray-700">{recipe.rating || 0}</span>
                            </div>
                            <div className="w-px h-3 bg-gray-200" />
                            <div className="flex items-center gap-1 text-rose-500">
                                <Heart size={14} fill="currentColor" />
                                <span className="text-sm font-bold text-gray-700">{likesCount}</span>
                            </div>
                        </div>
                        <div className="text-xs text-gray-400">
                            by {recipe.author?.username || 'Chef'}
                        </div>
                    </div>

                    <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1 group-hover:text-primary-600 transition-colors">
                        {recipe.title}
                    </h3>

                    <p className="text-gray-500 text-sm line-clamp-2 mb-4 h-10">
                        {recipe.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs font-medium text-gray-500 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-primary-500" />
                            <span>{recipe.time_minutes || 30} min</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Flame size={14} className="text-orange-500" />
                            <span>{Math.round(recipe.ingredients.reduce((acc, curr) => acc + (curr.amount_in_grams * (curr.ingredient.calories_per_100g || 0) / 100), 0))} kcal</span>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
