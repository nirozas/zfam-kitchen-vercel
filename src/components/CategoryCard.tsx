import { Category } from '@/lib/types';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface CategoryCardProps {
    category: Category;
    index: number;
}

export default function CategoryCard({ category, index }: CategoryCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
        >
            <Link to={`/category/${category.slug}`} className="block group">
                <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md hover:border-primary-100 hover:-translate-y-1">
                    <div className="w-16 h-16 mx-auto mb-4 bg-primary-50 rounded-full overflow-hidden flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
                        {category.image_url ? (
                            <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                        ) : (
                            getCategoryEmoji(category.slug)
                        )}
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {category.name}
                    </h3>
                </div>
            </Link>
        </motion.div>
    );
}

function getCategoryEmoji(slug: string) {
    switch (slug) {
        case 'breakfast': return '🍳';
        case 'lunch': return '🥗';
        case 'dinner': return '🍝';
        case 'dessert': return '🍰';
        default: return '🍽️';
    }
}
