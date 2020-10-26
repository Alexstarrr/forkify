import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader,clearLoader } from './views/base';

/**Global state of the app
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes
 */
const state = {};
// window.state = state;
/**
 * Search controller
 */
const controlSearch = async () => {
    // 1)Get the query from the view
    const query = searchView.getInput();

    // 2)new search object and add to state
    if (query) {
        state.search = new Search(query);
    }
    // 3)Prepare UI for results
    searchView.clearInput();
    searchView.clearUIResult();
        // render loading image
    renderLoader(elements.searchRes);

    try {    
        // 4)Search for receipes
        await state.search.getResults();

        // 5) Render results on UI
        // clear loader image
        clearLoader();
        searchView.renderResults(state.search.result);
    } catch(error) {
        alert ('Something went wrong with the search');
        clearLoader();
    }
}

elements.searchForm.addEventListener('submit', e =>{
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e=> {
    const btn = e.target.closest(`.btn-inline`);
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto,10);
        //clear results when click the button
        searchView.clearUIResult();
        //render new results 
        searchView.renderResults(state.search.result,goToPage);
    }
})

/**
 * Recipe controller
 */
const controlRecipe = async() => {
    // get the id from url
    const id = window.location.hash.replace('#','');
    if (id) {
        //prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);
        //Highlight selected search item
        if (searchView) searchView.highlightSelected(id);
        

        //create new recipe object
        state.recipe = new Recipe(id);
        try {
            //Get recipe data and parse ingredient
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();
            // Calculate servings and time
            state.recipe.calcServing();
            state.recipe.calcTime();
            // Render recipe
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
            );
        } catch(error) {
            alert('Error processing recipe!')
            console.log(error);
        }


    }
    
}

// call controller whenever the hash part changes
// call controller whenever reload
['hashchange','load'].forEach(event=> window.addEventListener(event,controlRecipe));

/**
 * List controller
 */
const controlList = () => {
    //create a new list IF there is none yet
    if (!state.list) state.list = new List();

    //Add each ingredients to the list
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count,el.unit,el.ingredient);
        listView.renderItem(item);
    })
}

// Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // handle delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        //delete from state
        state.list.deleteItem(id);

        //delete from UI
        listView.deleteItem(id);
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value);
        state.list.updateCount(id,val);
    }
});
/**
 * Like controller
 * 
 * 
 */
const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID= state.recipe.id;
    //user has NOT yet liked current recipe
    if (!state.likes.isLiked(currentID)) {
        //Add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.image
        )
        //Toggle the like button
        likesView.toogleLikeBtn(true);
        //Add like to UI list
        likesView.renderLike(newLike);
    //user HAS liked current recipe    
    } else {
        //Remove like from the state
        state.likes.deleteLike(currentID);
        //Toggle the like button
        likesView.toogleLikeBtn(false);
        // Remove like from UI list
        likesView.deleteLike(currentID);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
    
}

// Restore liked recipes on page loads
window.addEventListener('load',() => {
    state.likes = new Likes();

    // Restore likes
    state.likes.readStorage();

    // Toggle the menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // Render the existing likes
    state.likes.likes.forEach(el => likesView.renderLike(el));
})

//hanlding recipe button clicks
elements.recipe.addEventListener ('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        // Drecrease button is clicked
        if (state.recipe.servings > 1 ) {
            state.recipe.updateServing('dec');
            recipeView.updateServingsIngredients(state.recipe)
        }
        
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // Increase button is clicked
        state.recipe.updateServing('inc');
        recipeView.updateServingsIngredients(state.recipe)
    } else if (e.target.matches('.recipe__btn--add,.recipe__btn--add *')) {
        // Add ingredients to shopping list
        controlList();        
    } else if (e.target.matches('recipe__love, .recipe__love *')) {
        // Like controller
        controlLike();
    }

    
})

