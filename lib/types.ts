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

export interface Income {
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

export const INCOME_CATEGORIES: Category[] = [
  'Salary',
  'Freelance',
  'Investment',
  'Gift',
  'Other',
];
