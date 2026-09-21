import { state } from "./state.js";

export function getCategoriesByGroup(group) {

  return state.categories.filter(
    category => category.group === group
  );

}


export function getCategoryNamesByGroup(group) {

  return getCategoriesByGroup(group)
    .map(category => category.name);

}


export function getCategoryGroup(categoryName) {

  const category =
    state.categories.find(
      existing => existing.name === categoryName
    );

  return category
    ? category.group
    : "Neutral";

}