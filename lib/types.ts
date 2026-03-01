export type Category = string;

export interface CategoryData {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
}

export const CATEGORIES: Category[] = [
  'Food',
  'Transport',
  'Entertainment',
  'Health',
  'Shopping',
  'Bills',
  'Other',
];
