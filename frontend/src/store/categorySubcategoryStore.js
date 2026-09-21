import { createApiStore } from './createApiStore';
import * as api from '../api/masters';

const mapCategory = (r) => ({ id: r.id, name: r.name, code: r.code, description: r.description });
const mapSubcategory = (r) => ({
  id: r.id,
  name: r.name,
  categoryId: r.category,
  categoryName: r.category_name,
  description: r.description,
});

const categoryStore = createApiStore({ fetchList: api.getCategories, mapRecord: mapCategory });
const subcategoryStore = createApiStore({ fetchList: api.getSubcategories, mapRecord: mapSubcategory });

export function useCategories() {
  return categoryStore.useItems();
}

export function useSubcategories() {
  return subcategoryStore.useItems();
}

export function getCategoriesSnapshot() {
  return categoryStore.getSnapshot();
}

export function getSubcategoriesSnapshot() {
  return subcategoryStore.getSnapshot();
}

const categoryByName = (name) => (c) => c.name === name;

export async function addCategory({ name, description = '' }) {
  const n = name?.trim();
  if (!n) return { ok: false, reason: 'name' };
  return categoryStore.run(() => api.createCategory({ name: n, description: description.trim() }));
}

export async function updateCategory(oldName, name) {
  const n = name?.trim();
  if (!n) return { ok: false, reason: 'name' };
  const id = categoryStore.findId(categoryByName(oldName));
  if (!id) return { ok: false, reason: 'notfound' };
  return categoryStore.run(() => api.updateCategory(id, { name: n }));
}

export async function deleteCategory(id) {
  const res = await categoryStore.run(() => api.deleteCategory(id));
  if (res.ok) await subcategoryStore.load();
  return res;
}

export async function addSubcategory({ categoryName, name, description = '' }) {
  const n = name?.trim();
  if (!n) return { ok: false, reason: 'name' };
  const categoryId = categoryStore.findId(categoryByName(categoryName));
  if (!categoryId) return { ok: false, reason: 'category' };
  return subcategoryStore.run(() =>
    api.createSubcategory({ category: categoryId, name: n, description: description.trim() })
  );
}

export async function updateSubcategory(id, name) {
  const n = name?.trim();
  if (!n) return { ok: false, reason: 'name' };
  return subcategoryStore.run(() => api.updateSubcategory(id, { name: n }));
}

export async function deleteSubcategory(id) {
  return subcategoryStore.run(() => api.deleteSubcategory(id));
}