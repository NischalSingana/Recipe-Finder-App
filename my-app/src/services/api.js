import axios from 'axios';

const API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging (optional)
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response received
      console.error('Network Error:', error.request);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// API Service Functions
export const recipeAPI = {
  // Search recipes by name
  searchByName: async (query) => {
    try {
      const response = await apiClient.get('/search.php', {
        params: { s: query },
      });
      return response.data.meals || [];
    } catch (error) {
      throw new Error(`Failed to search recipes by name: ${error.message}`);
    }
  },

  // Search recipes by ingredient
  searchByIngredient: async (ingredient) => {
    try {
      const response = await apiClient.get('/filter.php', {
        params: { i: ingredient },
      });
      return response.data.meals || [];
    } catch (error) {
      throw new Error(`Failed to search recipes by ingredient: ${error.message}`);
    }
  },

  // Get recipe by ID
  getRecipeById: async (id) => {
    try {
      const response = await apiClient.get('/lookup.php', {
        params: { i: id },
      });
      return response.data.meals?.[0] || null;
    } catch (error) {
      throw new Error(`Failed to get recipe: ${error.message}`);
    }
  },

  // Get recipes by category
  getRecipesByCategory: async (category) => {
    try {
      const response = await apiClient.get('/filter.php', {
        params: { c: category },
      });
      return response.data.meals || [];
    } catch (error) {
      throw new Error(`Failed to get recipes by category: ${error.message}`);
    }
  },

  // Get all categories
  getCategories: async () => {
    try {
      const response = await apiClient.get('/list.php', {
        params: { c: 'list' },
      });
      return response.data.meals || [];
    } catch (error) {
      throw new Error(`Failed to get categories: ${error.message}`);
    }
  },

  // Get full recipe details for multiple recipes
  getRecipeDetails: async (mealIds) => {
    try {
      const details = await Promise.all(
        mealIds.map((id) => recipeAPI.getRecipeById(id))
      );
      return details.filter((recipe) => recipe !== null);
    } catch (error) {
      throw new Error(`Failed to get recipe details: ${error.message}`);
    }
  },

  // Get random recipes
  getRandomRecipes: async (count = 12) => {
    try {
      const randomRecipes = await Promise.all(
        Array.from({ length: count }, () =>
          apiClient.get('/random.php').then((res) => res.data.meals?.[0])
        )
      );
      return randomRecipes.filter((recipe) => recipe !== null && recipe !== undefined);
    } catch (error) {
      throw new Error(`Failed to get random recipes: ${error.message}`);
    }
  },

  // Smart search - tries name first, then ingredient
  smartSearch: async (query) => {
    try {
      // Try searching by name first
      let results = await recipeAPI.searchByName(query);
      
      // If no results, try searching by ingredient
      if (results.length === 0) {
        const ingredientResults = await recipeAPI.searchByIngredient(query);
        
        // If we got results from ingredient search, fetch full details
        if (ingredientResults.length > 0) {
          const mealIds = ingredientResults.map((meal) => meal.idMeal);
          results = await recipeAPI.getRecipeDetails(mealIds);
        }
      }
      
      return results;
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  },
};

export default apiClient;

