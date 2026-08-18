import { loadData, saveData } from "./storage.js";

export const state = loadData();

if (!state.captures) {
  state.captures = [];
  saveData(state);
}