import { motion } from 'framer-motion';
import RecipeCard from './RecipeCard';

function RecipeList({ recipes, favorites, onToggleFavorite, showEmptyMessage = true }) {
  if (recipes.length === 0) {
    if (!showEmptyMessage) return null;
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <p className="text-gray-600 text-lg">No recipes found. Try a different search!</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      {recipes.map((recipe, index) => (
        <motion.div
          key={recipe.idMeal}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <RecipeCard
            recipe={recipe}
            isFavorite={favorites.includes(recipe.idMeal)}
            onToggleFavorite={onToggleFavorite}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

export default RecipeList;

