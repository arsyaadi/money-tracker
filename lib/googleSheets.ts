import { headers } from 'next/headers';
import type { Category, Expense, Income, CategoryData, Asset } from './types';

export { CATEGORIES, INCOME_CATEGORIES } from './types';
export type { Category, Expense, Income, CategoryData, Asset } from './types';

function normalizeDateOnly(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') {
    const directMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (directMatch) return directMatch[1];
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
    date: normalizeDateOnly(e.createdAt)
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
    date: normalizeDateOnly(created.createdAt) || expense.date
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
    date: normalizeDateOnly(i.createdAt)
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
    date: normalizeDateOnly(created.createdAt) || income.date
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

// ===== ASSET FUNCTIONS =====

export async function getAssets(): Promise<Asset[]> {
  const { assets } = await appsScriptFetch<{ assets: any[] }>({
    action: 'getAssets',
  });
  
  return assets.map(a => ({
    id: a.id,
    name: a.name,
    amount: Number(a.amount),
    icon: a.icon,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }));
}

export async function addAsset(
  asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Asset> {
  const { asset: created } = await appsScriptFetch<{ asset: any }>(
    null,
    { action: 'addAsset', asset }
  );
  return {
    id: created.id,
    name: created.name,
    amount: Number(created.amount),
    icon: created.icon,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  };
}

export async function updateAsset(
  asset: Pick<Asset, 'id' | 'name' | 'amount' | 'icon'>
): Promise<Asset> {
  const { asset: updated } = await appsScriptFetch<{ asset: any }>(
    null,
    { action: 'updateAsset', asset }
  );
  return {
    id: updated.id,
    name: updated.name,
    amount: Number(updated.amount),
    icon: updated.icon,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

export async function deleteAsset(id: string): Promise<void> {
  await appsScriptFetch<{ success: boolean }>(null, {
    action: 'deleteAsset',
    id,
  });
}

export async function getAssetsTotal() {
  const data = await appsScriptFetch<any>({ action: 'getAssetsTotal' });
  return data;
}
