import Search from "./models/Search";
import Recipe from "./models/Recipe";
import List from "./models/List";
import Likes from "./models/Likes";
import * as searchView from "./views/searchView";
import * as recipeView from "./views/recipeView";
import * as listView from "./views/listView";
import * as likesView from "./views/likesView";
import { elements, renderLoader, clearLoader } from "./views/base";

/** Global state
 * - Search Object
 * - Current recipe Object
 * - shopping list object
 * - liked recipes
 */
const state = {};

const controlSearch = async () => {
  // 1 - get query from the view
  const query = searchView.getInput();

  if (query) {
    //2 - new search object and add to state
    state.search = new Search(query);
    //3 - prepare ui for results
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);

    try {
      //4 - search for recipes
      await state.search.getResults();

      //5 - render results on UI
      clearLoader();
      searchView.renderResults(state.search._result);
    } catch (err) {
      console.log(err);
      clearLoader();
    }
  }
};

//!! recipe controller
const controlRecipe = async () => {
  //get id from url by extracting the hash and replacing the # with nothing
  const id = window.location.hash.replace("#", "");
  if (id) {
    //  prepare ui for changes
    renderLoader(elements.recipe);
    // highlight selected search item
    if (state.search) {
      searchView.highlightSelected(id);
    }
    //  create new recipe object

    state.recipe = new Recipe(id);

    try {
      //  get recipe data and parse ingredients
      await state.recipe.getRecipe();
      state.recipe.parseIngredients();
      //  calculate servings and time
      state.recipe.calcTime();
      state.recipe.calcServings();

      // render recipe
      clearLoader();

      recipeView.clearRecipe();
      recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
    } catch (error) {
      console.log(error);
    }
  }
};

//!! event listeners
elements.searchForm.addEventListener("submit", e => {
  e.preventDefault();
  controlSearch();
});

elements.searchRes.addEventListener("click", e => {
  const btn = e.target.closest(".btn-inline");
  if (btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResults(state.search._result, goToPage);
  }
});
// window.addEventListener("hashchange", controlRecipe);
// window.addEventListener('load', controlRecipe);

["hashchange", "load"].forEach(event =>
  window.addEventListener(event, controlRecipe)
);

window.addEventListener("load", () => {
  state.likes = new Likes();

  //restore likes
  state.likes.readStorage();

  //set button state
  likesView.toggleLikeMenu(state.likes.getNumLikes());

  //render the existing likes
  state.likes.likes.forEach(like => likesView.renderLike(like));
});

//!! List Controller
const controlList = () => {
  // Create a new list IF there is none yet
  if (!state.list) {
    state.list = new List();
  }
  // Add each ingredient to the list and user interface
  state.recipe._ingredients.forEach(el => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  });
};

//!! Likes Controller

const controlLike = () => {
  if (!state.likes) {
    state.likes = new Likes();
  }

  const currentID = state.recipe._id;

  //> user has not yet liked current recipe
  if (!state.likes.isLiked(currentID)) {
    // Add like to state
    const newLike = state.likes.addLike(
      currentID,
      state.recipe._title,
      state.recipe._author,
      state.recipe._img
    );

    // Toggle the like button
    likesView.toggleLikeBtn(true);

    //Add like to UI list
    likesView.renderLike(newLike);

    //> current has liked current recipe
  } else {
    // Remove like from state
    state.likes.deleteLike(currentID);

    // Toggle the like button
    likesView.toggleLikeBtn(false);

    //Remove like from UI list
    likesView.deleteLike(currentID);
  }

  likesView.toggleLikeMenu(state.likes.getNumLikes());
};

//!! handle delete and update list item events
elements.shopping.addEventListener("click", e => {
  e.preventDefault();
  const id = e.target.closest(".shopping__item").dataset.itemid;
  // handle the delete button
  if (e.target.matches(".shopping__delete, .shopping__delete *")) {
    //delete from state
    state.list.deleteItem(id);
    //delete from ui
    listView.deleteItem(id);

    //handle count update
  } else if (e.target.matches(".shopping__count-value")) {
    const val = parseFloat(e.target.value, 10);
    state.list.updateCount(id, val);
  }
});

//* handling recipe button clicks
elements.recipe.addEventListener("click", e => {
  e.preventDefault();
  if (e.target.matches(".btn-decrease, .btn-decrease *")) {
    //decrease button is clicked
    if (state.recipe._servings > 1) {
      state.recipe.updateServings("dec");
      recipeView.updateServingsIngredients(state.recipe);
    }
  }
  if (e.target.matches(".btn-increase, .btn-increase *")) {
    //increase button is clicked
    state.recipe.updateServings("inc");
    recipeView.updateServingsIngredients(state.recipe);
  } else if (e.target.matches(".recipe__btn--add, .recipe__btn--add *")) {
    //> Add ingredients to shopping list
    controlList();
  } else if (e.target.matches(".recipe__love, .recipe__love *")) {
    //> Like Controller
    controlLike();
  }
});
