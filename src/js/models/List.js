import uniqid from 'uniqid';
export default class List {
  constructor() {
    this._items = [];
  }

  addItem(count, unit, ingredient) {
    const item = {
      id: uniqid(),
      count,
      unit,
      ingredient
    }
    this._items.push(item);
    return item;
  }

  deleteItem(id) {
    const index = this._items.findIndex(el => el.id === id);
    //[2,4,8].splice (1,2) -> return 4 and 8, original array is [2]
    //[2,4,8].slice (1,2) -> return 4, original array is [2,4,8]
    this._items.splice(index, 1);
  }

  updateCount(id, newCount) {
    this._items.find(el => el.id === id).count = newCount;
  }
}