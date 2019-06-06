import axios from "axios";
import {
  key,
  proxy
} from "../config";

export default class Recipe {
  constructor(id) {
    this._id = id;
  }

  async getRecipe() {
    try {
      const res = await axios(
        `${proxy}http://food2fork.com/api/get?key=${key}&rId=${this._id}`
      );
      this._title = res.data.recipe.title;
      this._author = res.data.recipe.publisher;
      this._img = res.data.recipe.image_url;
      this._url = res.data.recipe.source_url;
      this._ingredients = res.data.recipe.ingredients;
    } catch (err) {
      console.log(err);
      alert("Something went wrong");
    }
  }

  calcTime() {
    //Assuming that we need 15 minutes per each 3 ingredients
    const numIng = this._ingredients.length;
    const periods = Math.ceil(numIng / 3);
    this._time = periods * 15;
  }

  calcServings() {
    this._servings = 4;
  }

  parseIngredients() {
    const unitsLong = [
      "tablespoons",
      "tablespoon",
      "ounces",
      "ounce",
      "teaspoons",
      "teaspoon",
      "cups",
      "pounds"
    ];
    const unitsShort = [
      "tbsp",
      "tbsp",
      "oz",
      "oz",
      "tsp",
      "tsp",
      "cup",
      "pound"
    ];

    const units = [...unitsShort, 'kg', 'g'];

    const newIngredients = this._ingredients.map(el => {
      //uniform units
      let ingredient = el.toLowerCase();
      unitsLong.forEach((unit, i) => {
        ingredient = ingredient.replace(unit, unitsShort[i]);
      });

      //remove parentheses
      ingredient = ingredient.replace(/ *\([^)]*\) */g, " ");

      //parse ingredients into count, unit and ingredient
      const arrIng = ingredient.split(" ");
      const unitIndex = arrIng.findIndex(el2 => units.includes(el2));

      let objIng;
      if (unitIndex > -1) {
        //there is a unit
        const arrCount = arrIng.slice(0, unitIndex); // ex. 4 1/2 cups => [4, 1/2] -> eval("4+1/2") -> 4.5

        let count;
        if (arrCount.length === 1) {
          count = arrIng[0].replace("-", "+");
        } else {
          count = eval(arrIng.slice(0, unitIndex).join("+"));
        }

        objIng = {
          count,
          unit: arrIng[unitIndex],
          ingredient: arrIng.slice(unitIndex + 1).join(" ")
        };
      } else if (parseInt(arrIng[0], 10)) {
        //there is no unit, but 1st element is a number
        objIng = {
          count: parseInt(arrIng[0], 10),
          unit: "",
          ingredient: arrIng.slice(1).join(" ")
        };
      } else if (unitIndex === -1) {
        //there is NO unit and no number in 1st position
        objIng = {
          count: 1,
          unit: "",
          ingredient: ingredient
        };
      }

      return objIng;
    });
    this._ingredients = newIngredients;
  }

  updateServings(type) {
    //servings
    const newServings = type === 'dec' ? this._servings - 1 : this._servings + 1;

    //ingredients
    this._ingredients.forEach(ing => ing.count *= (newServings / this._servings))
    this._servings = newServings;
  }
}