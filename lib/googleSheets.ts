import { headers } from 'next/headers';
import type { Category, Expense, Income, CategoryData } from './types';

export { CATEGORIES, INCOME_CATEGORIES } from './types';
export type { Category, Expense, Income, CategoryData } from './types';

async function getAppsScriptUrl(): Promise<string> {
  const headersList = await headers();
  let deploymentId = headersList.get('x-deployment-id') || 
    headersList.get('cookie')?.split('; ')
      .find(row => row.startsWith('deployment_id='))
      ?.split('=')[1];

  if (deploymentId) {
    if (deploymentId.startsWith('http')) {
      const match = deploymentId.match(/\/s\/([a-zA-Z0-9_-]+)/);
      if (match) {
        deploymentId = match[1];
      } else {
        return deploymentId;
      }
    }
    return "https://script.google.com/macros/s/" + deploymentId + "/exec";
  }

  const url = process.env.APPS_SCRIPT_URL;
  if (!url) {
    throw new Error('Missing APPS_SCRIPT_URL environment variable');
  }
  return url;
}

async function appsScriptFetch<T>(
  params: Record<string, string> | null,
  body?: Record<string, unknown>
): Promise<T> {
  const base = await getAppsScriptUrl();

  let url = base;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    url = base + "?" + qs;
  }

  const options: RequestInit = { redirect: 'follow', cache: 'no-store' };

  if (body) {
    options.method = 'POST';
    options.headers = { 'Content-Type': 'text/plain' };
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const text = await res.text();

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Invalid response from Apps Script (not JSON)");
  }

  if (typeof data === 'object' && data !== null && 'error' in data) {
    throw new Error((data as { error: string }).error);
  }

  return data as T;
}

export async function getCategories(): Promise<CategoryData[]> {
  const data = await appsScriptFetch<any>({
    action: 'getCategories',
  });
  return data.categories || [];
}

export async function addCategory(
  category: Omit<CategoryData, 'id'>
): Promise<CategoryData> {
  const { category: created } = await appsScriptFetch<{ category: CategoryData }>(
    null,
    { action: 'addCategory', category }
  );
  return created;
}


export async function deleteCategory(id: string): Promise<void> {
  await appsScriptFetch<{ success: boolean }>(null, {
    action: 'deleteCategory',
    id,
  });
}

export async function getExpenses(month?: string, category?: string): Promise<Expense[]> {
  const { expenses } = await appsScriptFetch<{ expenses: any[] }>({
    action: 'getExpenses', ...(month && { month }), ...(category && { category })
  });
  
  return expenses.map(e => ({
    id: e.id,
    title: e.title,
    amount: e.amount,
    category: e.category,
    date: e.createdAt ? e.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]
  }));
}

export async function addExpense(
  expense: Omit<Expense, 'id' | 'createdAt' | 'date'> & { date: string }
): Promise<Expense> {
  const { expense: created } = await appsScriptFetch<{ expense: any }>(
    null,
    { action: 'addExpense', expense }
  );
  return {
    ...created,
    date: created.createdAt ? created.createdAt.split('T')[0] : expense.date
  };
}

export async function deleteExpense(id: string): Promise<void> {
  await appsScriptFetch<{ success: boolean }>(null, {
    action: 'deleteExpense',
    id,
  });
}

export async function getMonthlySummary(month: string) {
  const data = await appsScriptFetch<any>({ action: 'getMonthlySummary', month });
  return data;
}

export async function getCategoryTotals(month?: string) {
  const data = await appsScriptFetch<any>({ action: 'getCategoryTotals', ...(month && { month }) });
  return data;
}

export async function getMonthlyTotal(month: string) {
  const data = await appsScriptFetch<any>({ action: 'getMonthlyTotal', month });
  return data;
}

// ===== INCOME FUNCTIONS =====

export async function getIncomeCategories(): Promise<CategoryData[]> {
  const data = await appsScriptFetch<any>({
    action: 'getIncomeCategories',
  });
  return data.categories || [];
}

export async function addIncomeCategory(
  category: Omit<CategoryData, 'id'>
): Promise<CategoryData> {
  const { category: created } = await appsScriptFetch<{ category: CategoryData }>(
    null,
    { action: 'addIncomeCategory', category }
  );
  return created;
}

export async function deleteIncomeCategory(id: string): Promise<void> {
  await appsScriptFetch<{ success: boolean }>(null, {
    action: 'deleteIncomeCategory',
    id,
  });
}

export async function getIncomes(month?: string, category?: string): Promise<Income[]> {
  const { incomes } = await appsScriptFetch<{ incomes: any[] }>({
    action: 'getIncomes', ...(month && { month }), ...(category && { category })
  });
  
  return incomes.map(i => ({
    id: i.id,
    title: i.title,
    amount: i.amount,
    category: i.category,
    date: i.createdAt ? i.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]
  }));
}

export async function addIncome(
  income: Omit<Income, 'id' | 'createdAt' | 'date'> & { date: string }
): Promise<Income> {
  const { income: created } = await appsScriptFetch<{ income: any }>(
    null,
    { action: 'addIncome', income }
  );
  return {
    ...created,
    date: created.createdAt ? created.createdAt.split('T')[0] : income.date
  };
}

export async function deleteIncome(id: string): Promise<void> {
  await appsScriptFetch<{ success: boolean }>(null, {
    action: 'deleteIncome',
    id,
  });
}

export async function getMonthlyIncomeTotal(month: string) {
  const data = await appsScriptFetch<any>({ action: 'getMonthlyIncomeTotal', month });
  return data;
}

export async function getIncomeCategoryTotals(month?: string) {
  const data = await appsScriptFetch<any>({ action: 'getIncomeCategoryTotals', ...(month && { month }) });
  return data;
}
