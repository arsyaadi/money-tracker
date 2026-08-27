import { invoke } from '@tauri-apps/api/core';
import type { CategoryData, Expense, Income, Asset } from './types';

export function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  return '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
}

export function getDeploymentId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem('APPS_SCRIPT_DEPLOYMENT_ID') || undefined;
}

function getAppsScriptBaseUrl(deploymentId?: string): string | null {
  const id = deploymentId || getDeploymentId();
  if (!id || !id.trim()) return null;

  const trimmed = id.trim();
  if (trimmed.startsWith('http')) {
    if (trimmed.includes('/s/')) {
      const pos = trimmed.indexOf('/s/');
      const afterS = trimmed.slice(pos + 3);
      const slashPos = afterS.indexOf('/');
      const depId = slashPos !== -1 ? afterS.slice(0, slashPos) : afterS;
      return `https://script.google.com/macros/s/${depId}/exec`;
    }
    return trimmed;
  }
  return `https://script.google.com/macros/s/${trimmed}/exec`;
}

function normalizeDateString(val: unknown): string {
  if (!val) return new Date().toISOString().substring(0, 10);
  const str = String(val).trim();
  if (str.length >= 10 && str[4] === '-' && str[7] === '-') {
    return str.substring(0, 10);
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().substring(0, 10);
  }
  return str.substring(0, 10) || new Date().toISOString().substring(0, 10);
}

async function appsScriptGet<T>(params: Record<string, string | undefined>): Promise<T> {
  const baseUrl = getAppsScriptBaseUrl();
  if (!baseUrl) {
    throw new Error('Google Apps Script Deployment ID not configured');
  }

  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      url.searchParams.append(key, val);
    }
  });

  const res = await fetch(url.toString(), {
    method: 'GET',
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`Google Apps Script request failed with status ${res.status}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data as T;
}

async function appsScriptPost<T>(body: Record<string, unknown>): Promise<T> {
  const baseUrl = getAppsScriptBaseUrl();
  if (!baseUrl) {
    throw new Error('Google Apps Script Deployment ID not configured');
  }

  // Note: Using 'text/plain;charset=utf-8' prevents CORS preflight OPTIONS request in browser
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(body),
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`Google Apps Script request failed with status ${res.status}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data as T;
}

// ===== CATEGORIES =====
export async function getCategories(): Promise<CategoryData[]> {
  if (isTauri()) {
    return await invoke<CategoryData[]>('get_categories', {
      deploymentId: getDeploymentId(),
    });
  }

  if (!getDeploymentId()) return [];

  try {
    const data = await appsScriptGet<{ categories?: CategoryData[] }>({
      action: 'getCategories',
    });
    return data.categories || [];
  } catch (err) {
    console.warn('Direct fetch categories failed:', err);
    return [];
  }
}

export async function addCategory(category: Omit<CategoryData, 'id'>): Promise<CategoryData> {
  if (isTauri()) {
    return await invoke<CategoryData>('add_category', {
      category,
      deploymentId: getDeploymentId(),
    });
  }

  const data = await appsScriptPost<{ category: CategoryData }>({
    action: 'addCategory',
    category,
  });
  return data.category;
}

export async function deleteCategory(id: string): Promise<void> {
  if (isTauri()) {
    await invoke('delete_category', {
      id,
      deploymentId: getDeploymentId(),
    });
    return;
  }

  await appsScriptPost<{ success?: boolean }>({
    action: 'deleteCategory',
    id,
  });
}

// ===== EXPENSES =====
export async function getExpenses(month?: string, category?: string): Promise<Expense[]> {
  if (isTauri()) {
    return await invoke<Expense[]>('get_expenses', {
      month: month || undefined,
      category: category || undefined,
      deploymentId: getDeploymentId(),
    });
  }

  if (!getDeploymentId()) return [];

  try {
    const data = await appsScriptGet<{ expenses?: Expense[] }>({
      action: 'getExpenses',
      month: month || undefined,
      category: category || undefined,
    });
    return (data.expenses || []).map((e) => ({
      ...e,
      date: normalizeDateString(e.date),
      amount: Number(e.amount) || 0,
    }));
  } catch (err) {
    console.warn('Direct fetch expenses failed:', err);
    return [];
  }
}

export async function addExpense(
  expense: Omit<Expense, 'id' | 'createdAt' | 'date'> & { date: string }
): Promise<Expense> {
  if (isTauri()) {
    return await invoke<Expense>('add_expense', {
      expense,
      deploymentId: getDeploymentId(),
    });
  }

  const data = await appsScriptPost<{ expense: Expense }>({
    action: 'addExpense',
    expense,
  });
  return data.expense;
}

export async function deleteExpense(id: string): Promise<void> {
  if (isTauri()) {
    await invoke('delete_expense', {
      id,
      deploymentId: getDeploymentId(),
    });
    return;
  }

  await appsScriptPost<{ success?: boolean }>({
    action: 'deleteExpense',
    id,
  });
}

export interface MonthlyTotalResponse {
  total?: number;
  [key: string]: unknown;
}

export async function getMonthlySummary(month: string): Promise<Record<string, unknown>> {
  if (isTauri()) {
    return await invoke('get_monthly_summary', {
      month,
      deploymentId: getDeploymentId(),
    });
  }

  if (!getDeploymentId()) return {};

  return await appsScriptGet<Record<string, unknown>>({
    action: 'getMonthlySummary',
    month,
  });
}

export async function getMonthlyTotal(month: string): Promise<MonthlyTotalResponse> {
  if (isTauri()) {
    return await invoke<MonthlyTotalResponse>('get_monthly_total', {
      month,
      deploymentId: getDeploymentId(),
    });
  }

  if (!getDeploymentId()) return { total: 0 };

  return await appsScriptGet<MonthlyTotalResponse>({
    action: 'getMonthlyTotal',
    month,
  });
}

export async function getCategoryTotals(month?: string): Promise<Record<string, number>> {
  if (isTauri()) {
    return await invoke('get_category_totals', {
      month: month || undefined,
      deploymentId: getDeploymentId(),
    });
  }

  if (!getDeploymentId()) return {};

  return await appsScriptGet<Record<string, number>>({
    action: 'getCategoryTotals',
    month: month || undefined,
  });
}

// ===== INCOME CATEGORIES =====
export async function getIncomeCategories(): Promise<CategoryData[]> {
  if (isTauri()) {
    return await invoke<CategoryData[]>('get_income_categories', {
      deploymentId: getDeploymentId(),
    });
  }

  if (!getDeploymentId()) return [];

  try {
    const data = await appsScriptGet<{ categories?: CategoryData[] }>({
      action: 'getIncomeCategories',
    });
    return data.categories || [];
  } catch (err) {
    console.warn('Direct fetch income categories failed:', err);
    return [];
  }
}

export async function addIncomeCategory(
  category: Omit<CategoryData, 'id'>
): Promise<CategoryData> {
  if (isTauri()) {
    return await invoke<CategoryData>('add_income_category', {
      category,
      deploymentId: getDeploymentId(),
    });
  }

  const data = await appsScriptPost<{ category: CategoryData }>({
    action: 'addIncomeCategory',
    category,
  });
  return data.category;
}

export async function deleteIncomeCategory(id: string): Promise<void> {
  if (isTauri()) {
    await invoke('delete_income_category', {
      id,
      deploymentId: getDeploymentId(),
    });
    return;
  }

  await appsScriptPost<{ success?: boolean }>({
    action: 'deleteIncomeCategory',
    id,
  });
}

// ===== INCOMES =====
export async function getIncomes(month?: string, category?: string): Promise<Income[]> {
  if (isTauri()) {
    return await invoke<Income[]>('get_incomes', {
      month: month || undefined,
      category: category || undefined,
      deploymentId: getDeploymentId(),
    });
  }

  if (!getDeploymentId()) return [];

  try {
    const data = await appsScriptGet<{ incomes?: Income[] }>({
      action: 'getIncomes',
      month: month || undefined,
      category: category || undefined,
    });
    return (data.incomes || []).map((i) => ({
      ...i,
      date: normalizeDateString(i.date),
      amount: Number(i.amount) || 0,
    }));
  } catch (err) {
    console.warn('Direct fetch incomes failed:', err);
    return [];
  }
}

export async function addIncome(
  income: Omit<Income, 'id' | 'createdAt' | 'date'> & { date: string }
): Promise<Income> {
  if (isTauri()) {
    return await invoke<Income>('add_income', {
      income,
      deploymentId: getDeploymentId(),
    });
  }

  const data = await appsScriptPost<{ income: Income }>({
    action: 'addIncome',
    income,
  });
  return data.income;
}

export async function deleteIncome(id: string): Promise<void> {
  if (isTauri()) {
    await invoke('delete_income', {
      id,
      deploymentId: getDeploymentId(),
    });
    return;
  }

  await appsScriptPost<{ success?: boolean }>({
    action: 'deleteIncome',
    id,
  });
}

export async function getMonthlyIncomeTotal(month: string): Promise<MonthlyTotalResponse> {
  if (isTauri()) {
    return await invoke<MonthlyTotalResponse>('get_monthly_income_total', {
      month,
      deploymentId: getDeploymentId(),
    });
  }

  if (!getDeploymentId()) return { total: 0 };

  return await appsScriptGet<MonthlyTotalResponse>({
    action: 'getMonthlyIncomeTotal',
    month,
  });
}

export async function getIncomeCategoryTotals(month?: string): Promise<Record<string, number>> {
  if (isTauri()) {
    return await invoke('get_income_category_totals', {
      month: month || undefined,
      deploymentId: getDeploymentId(),
    });
  }

  if (!getDeploymentId()) return {};

  return await appsScriptGet<Record<string, number>>({
    action: 'getIncomeCategoryTotals',
    month: month || undefined,
  });
}

// ===== ASSETS =====
export async function getAssets(): Promise<Asset[]> {
  if (isTauri()) {
    return await invoke<Asset[]>('get_assets', {
      deploymentId: getDeploymentId(),
    });
  }

  if (!getDeploymentId()) return [];

  try {
    const data = await appsScriptGet<{ assets?: Asset[] }>({
      action: 'getAssets',
    });
    return data.assets || [];
  } catch (err) {
    console.warn('Direct fetch assets failed:', err);
    return [];
  }
}

export async function addAsset(
  asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Asset> {
  if (isTauri()) {
    return await invoke<Asset>('add_asset', {
      asset,
      deploymentId: getDeploymentId(),
    });
  }

  const data = await appsScriptPost<{ asset: Asset }>({
    action: 'addAsset',
    asset,
  });
  return data.asset;
}

export async function updateAsset(
  asset: Pick<Asset, 'id' | 'name' | 'amount' | 'icon'>
): Promise<Asset> {
  if (isTauri()) {
    return await invoke<Asset>('update_asset', {
      asset,
      deploymentId: getDeploymentId(),
    });
  }

  const data = await appsScriptPost<{ asset: Asset }>({
    action: 'updateAsset',
    asset,
  });
  return data.asset;
}

export async function deleteAsset(id: string): Promise<void> {
  if (isTauri()) {
    await invoke('delete_asset', {
      id,
      deploymentId: getDeploymentId(),
    });
    return;
  }

  await appsScriptPost<{ success?: boolean }>({
    action: 'deleteAsset',
    id,
  });
}

export async function getAssetsTotal(): Promise<Record<string, unknown>> {
  if (isTauri()) {
    return await invoke('get_assets_total', {
      deploymentId: getDeploymentId(),
    });
  }

  if (!getDeploymentId()) return {};

  return await appsScriptGet<Record<string, unknown>>({
    action: 'getAssetsTotal',
  });
}
