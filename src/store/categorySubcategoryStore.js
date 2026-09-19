import { useSyncExternalStore } from 'react';

const SEED_CATEGORIES = [
  { id: 'CAT-001', name: 'Administrative', description: 'Office & General Overhead Expenses' },
  { id: 'CAT-002', name: 'Operating Expenses', description: 'Core Operations & Field Logistics' },
  { id: 'CAT-003', name: 'IT & Infrastructure', description: 'Software, Broadband & Cloud Infrastructure' },
  { id: 'CAT-004', name: 'Sales & Marketing', description: 'Advertising, Events & Client Outreach' },
  { id: 'CAT-005', name: 'Human Resources', description: 'Payroll, Training & Recruitment' },
  { id: 'CAT-006', name: 'Miscellaneous', description: 'General & Contingency Expenses' },
];

const SEED_SUBCATEGORIES = [
  { id: 'SUB-001', categoryId: 'CAT-001', categoryName: 'Administrative', name: 'Office Stationery', description: 'Printing paper, files, pens' },
  { id: 'SUB-002', categoryId: 'CAT-001', categoryName: 'Administrative', name: 'Pantry & Catering', description: 'Coffee, tea, snacks' },
  { id: 'SUB-003', categoryId: 'CAT-002', categoryName: 'Operating Expenses', name: 'Fuel & Transit', description: 'Vehicle fuel & travel fares' },
  { id: 'SUB-004', categoryId: 'CAT-002', categoryName: 'Operating Expenses', name: 'Hardware Repair', description: 'UPS, AC & Equipment maintenance' },
  { id: 'SUB-005', categoryId: 'CAT-003', categoryName: 'IT & Infrastructure', name: 'Internet & Phone', description: 'Fiber broadband & phone lines' },
  { id: 'SUB-006', categoryId: 'CAT-003', categoryName: 'IT & Infrastructure', name: 'Software Subscription', description: 'SaaS tools & cloud hosting' },
  { id: 'SUB-007', categoryId: 'CAT-006', categoryName: 'Miscellaneous', name: 'Sundry Expenses', description: 'Minor unclassified expenses' },
  { id: 'SUB-008', categoryId: 'CAT-006', categoryName: 'Miscellaneous', name: 'Guest Refreshment & Snacks', description: 'Tea, coffee & snacks for visitors' },
  { id: 'SUB-009', categoryId: 'CAT-006', categoryName: 'Miscellaneous', name: 'General Maintenance', description: 'Small office repairs & maintenance' },
  { id: 'SUB-010', categoryId: 'CAT-006', categoryName: 'Miscellaneous', name: 'Other Expenses', description: 'Miscellaneous petty cash expenses' },
];

let categories = [...SEED_CATEGORIES];
let subcategories = [...SEED_SUBCATEGORIES];

let catCounter = 7;
let subCounter = 11;

const listeners = new Set();

function emit() {
  for (const l of listeners) l();
}

export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getCategoriesSnapshot() {
  return categories;
}

export function getSubcategoriesSnapshot() {
  return subcategories;
}

export function useCategories() {
  return useSyncExternalStore(subscribe, getCategoriesSnapshot);
}

export function useSubcategories() {
  return useSyncExternalStore(subscribe, getSubcategoriesSnapshot);
}

export function addCategory({ name, description = '' }) {
  const id = `CAT-${String(catCounter).padStart(3, '0')}`;
  catCounter += 1;
  const newCat = { id, name: name.trim(), description: description.trim() };
  categories = [...categories, newCat];
  emit();
  return newCat;
}

export function deleteCategory(id) {
  categories = categories.filter((c) => c.id !== id);
  // Also clean up or unlink subcategories
  subcategories = subcategories.filter((s) => s.categoryId !== id);
  emit();
}

export function addSubcategory({ categoryName, name, description = '' }) {
  const id = `SUB-${String(subCounter).padStart(3, '0')}`;
  subCounter += 1;
  const catObj = categories.find((c) => c.name === categoryName);
  const newSub = {
    id,
    categoryId: catObj?.id || '',
    categoryName: categoryName || 'General',
    name: name.trim(),
    description: description.trim(),
  };
  subcategories = [newSub, ...subcategories];
  emit();
  return newSub;
}

export function deleteSubcategory(id) {
  subcategories = subcategories.filter((s) => s.id !== id);
  emit();
}
