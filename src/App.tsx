import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import RecipeDetail from './pages/RecipeDetail';
import Planner from './pages/Planner';
import CreateRecipe from './pages/CreateRecipe';
import Auth from './pages/Auth';
import ShoppingCart from './pages/ShoppingCart';
import ManageCategories from './pages/ManageCategories';
import CategoryDetail from './pages/CategoryDetail';
import { ShoppingCartProvider } from './contexts/ShoppingCartContext';
import { MealPlannerProvider } from './contexts/MealPlannerContext';

import Search from './pages/Search';

function App() {
    return (
        <ShoppingCartProvider>
            <MealPlannerProvider>
                <BrowserRouter>
                    <Routes>
                        <Route element={<Layout />}>
                            <Route index element={<Home />} />
                            <Route path="search" element={<Search />} />
                            <Route path="recipe/:id" element={<RecipeDetail />} />
                            <Route path="planner" element={<Planner />} />
                            <Route path="create" element={<CreateRecipe />} />
                            <Route path="edit/:id" element={<CreateRecipe />} />
                            <Route path="auth" element={<Auth />} />
                            <Route path="cart" element={<ShoppingCart />} />
                            <Route path="categories" element={<ManageCategories />} />
                            <Route path="category/:id" element={<CategoryDetail />} />
                        </Route>
                    </Routes>
                </BrowserRouter>
            </MealPlannerProvider>
        </ShoppingCartProvider>
    );
}

export default App;
