import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SearchBar from './components/SearchBar';
import RecipeList from './components/RecipeList';
import { recipeAPI } from './services/api';

function App() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState([]); // Array of favorite recipe objects
  const [favoriteIds, setFavoriteIds] = useState([]); // Array of favorite IDs for quick lookup
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('recipeFavorites');
    if (savedFavorites) {
      const favoriteRecipes = JSON.parse(savedFavorites);
      setFavorites(favoriteRecipes);
      setFavoriteIds(favoriteRecipes.map(recipe => recipe.idMeal));
    }
  }, []);

  // Load categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const categoriesData = await recipeAPI.getCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories. Please refresh the page.');
    }
  };

  // Search recipes by name or ingredient
  const searchRecipes = async (searchTerm) => {
    setSelectedCategory(''); // Clear category filter when searching
    setLoading(true);
    setError(null);
    try {
      const results = await recipeAPI.smartSearch(searchTerm);
      setRecipes(results);
    } catch (err) {
      setError(err.message || 'Failed to fetch recipes. Please try again.');
      console.error('Error searching recipes:', err);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter recipes by category
  const filterByCategory = async (category) => {
    setSelectedCategory(category);
    if (!category) {
      // If "All" is selected, we keep the current recipes but remove the filter
      // The filteredRecipes logic will handle showing all recipes
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const categoryResults = await recipeAPI.getRecipesByCategory(category);
      if (categoryResults.length > 0) {
        // Fetch full details for each meal
        const mealIds = categoryResults.map(meal => meal.idMeal);
        const detailedMeals = await recipeAPI.getRecipeDetails(mealIds);
        setRecipes(detailedMeals);
      } else {
        setRecipes([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch recipes. Please try again.');
      console.error('Error filtering recipes:', err);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  // Toggle favorite
  const toggleFavorite = async (mealId) => {
    setFavorites(prev => {
      const isFavorite = prev.some(recipe => recipe.idMeal === mealId);
      let newFavorites;
      
      if (isFavorite) {
        // Remove from favorites
        newFavorites = prev.filter(recipe => recipe.idMeal !== mealId);
      } else {
        // Add to favorites - find the recipe in current recipes
        const recipeToAdd = recipes.find(recipe => recipe.idMeal === mealId);
        if (recipeToAdd) {
          newFavorites = [...prev, recipeToAdd];
        } else {
          // If recipe not in current list, fetch it
          recipeAPI.getRecipeById(mealId)
            .then(recipe => {
              if (recipe) {
                const updatedFavorites = [...prev, recipe];
                setFavorites(updatedFavorites);
                setFavoriteIds(updatedFavorites.map(r => r.idMeal));
                localStorage.setItem('recipeFavorites', JSON.stringify(updatedFavorites));
              }
            })
            .catch(err => {
              console.error('Error fetching recipe for favorites:', err);
            });
          return prev;
        }
      }
      
      // Update favorite IDs
      setFavoriteIds(newFavorites.map(recipe => recipe.idMeal));
      
      // Save to localStorage
      localStorage.setItem('recipeFavorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  // Filter recipes based on selected category (client-side filter for already loaded recipes)
  const filteredRecipes = selectedCategory && recipes.length > 0
    ? recipes.filter(recipe => recipe.strCategory === selectedCategory)
    : recipes;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
            🍳 Recipe Finder
          </h1>
          <p className="text-gray-600 text-lg">
            Discover delicious recipes from around the world
          </p>
        </motion.div>

        <SearchBar
          onSearch={searchRecipes}
          onCategoryChange={filterByCategory}
          selectedCategory={selectedCategory}
          categories={categories}
        />

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading recipes...</p>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6"
          >
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </motion.div>
        )}

        {!loading && !error && (
          <RecipeList
            recipes={filteredRecipes}
            favorites={favoriteIds}
            onToggleFavorite={toggleFavorite}
            showEmptyMessage={true}
          />
        )}

        {favorites.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 pt-8 border-t border-gray-300"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4">⭐ Your Favorites ({favorites.length})</h2>
            <RecipeList
              recipes={favorites}
              favorites={favoriteIds}
              onToggleFavorite={toggleFavorite}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default App;
