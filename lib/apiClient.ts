import { invoke } from '@tauri-apps/api/core';
import type { CategoryData, Expense, Income, Asset } from './types';

export function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  return '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
}

function getDeploymentId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem('APPS_SCRIPT_DEPLOYMENT_ID') || undefined;
}

function getWebHeaders(): HeadersInit {
  const deploymentId = getDeploymentId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (deploymentId) {
    headers['x-deployment-id'] = deploymentId;
  }
  return headers;
}

// ===== CATEGORIES =====
export async function getCategories(): Promise<CategoryData[]> {
  if (isTauri()) {
    return await invoke<CategoryData[]>('get_categories', {
      deploymentId: getDeploymentId(),
    });
  }
  const res = await fetch('/api/categories', {
    headers: getWebHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch categories');
  const data = await res.json();
  return data.categories || [];
}

export async function addCategory(category: Omit<CategoryData, 'id'>): Promise<CategoryData> {
  if (isTauri()) {
    return await invoke<CategoryData>('add_category', {
      category,
      deploymentId: getDeploymentId(),
    });
  }
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: getWebHeaders(),
    body: JSON.stringify(category),
  });
  if (!res.ok) throw new Error('Failed to add category');
  const data = await res.json();
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
  const res = await fetch(`/api/categories/${id}`, {
    method: 'DELETE',
    headers: getWebHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete category');
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
  const params = new URLSearchParams();
  if (month) params.append('month', month);
  if (category) params.append('category', category);
  const url = '/api/expenses' + (params.toString() ? '?' + params.toString() : '');
  const res = await fetch(url, {
    headers: getWebHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch expenses');
  const data = await res.json();
  return data.expenses || [];
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
  const res = await fetch('/api/expenses', {
    method: 'POST',
    headers: getWebHeaders(),
    body: JSON.stringify(expense),
  });
  if (!res.ok) throw new Error('Failed to add expense');
  const data = await res.json();
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
  const res = await fetch(`/api/expenses/${id}`, {
    method: 'DELETE',
    headers: getWebHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete expense');
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
  const res = await fetch(`/api/expenses/monthly-total?month=${month}`, {
    headers: getWebHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch monthly total');
  return await res.json();
}

export async function getMonthlyTotal(month: string): Promise<MonthlyTotalResponse> {
  if (isTauri()) {
    return await invoke<MonthlyTotalResponse>('get_monthly_total', {
      month,
      deploymentId: getDeploymentId(),
    });
  }
  const res = await fetch(`/api/expenses/monthly-total?month=${month}`, {
    headers: getWebHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch monthly total');
  return await res.json();
}

// ===== INCOME CATEGORIES =====
export async function getIncomeCategories(): Promise<CategoryData[]> {
  if (isTauri()) {
    return await invoke<CategoryData[]>('get_income_categories', {
      deploymentId: getDeploymentId(),
    });
  }
  const res = await fetch('/api/income-categories', {
    headers: getWebHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch income categories');
  const data = await res.json();
  return data.categories || [];
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
  const res = await fetch('/api/income-categories', {
    method: 'POST',
    headers: getWebHeaders(),
    body: JSON.stringify(category),
  });
  if (!res.ok) throw new Error('Failed to add income category');
  const data = await res.json();
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
  const res = await fetch(`/api/income-categories/${id}`, {
    method: 'DELETE',
    headers: getWebHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete income category');
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
  const params = new URLSearchParams();
  if (month) params.append('month', month);
  if (category) params.append('category', category);
  const url = '/api/incomes' + (params.toString() ? '?' + params.toString() : '');
  const res = await fetch(url, {
    headers: getWebHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch incomes');
  const data = await res.json();
  return data.incomes || [];
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
  const res = await fetch('/api/incomes', {
    method: 'POST',
    headers: getWebHeaders(),
    body: JSON.stringify(income),
  });
  if (!res.ok) throw new Error('Failed to add income');
  const data = await res.json();
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
  const res = await fetch(`/api/incomes/${id}`, {
    method: 'DELETE',
    headers: getWebHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete income');
}

export async function getMonthlyIncomeTotal(month: string): Promise<MonthlyTotalResponse> {
  if (isTauri()) {
    return await invoke<MonthlyTotalResponse>('get_monthly_income_total', {
      month,
      deploymentId: getDeploymentId(),
    });
  }
  const res = await fetch(`/api/incomes/monthly-total?month=${month}`, {
    headers: getWebHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch monthly income total');
  return await res.json();
}

// ===== ASSETS =====
export async function getAssets(): Promise<Asset[]> {
  if (isTauri()) {
    return await invoke<Asset[]>('get_assets', {
      deploymentId: getDeploymentId(),
    });
  }
  const res = await fetch('/api/assets', {
    headers: getWebHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch assets');
  const data = await res.json();
  return data.assets || [];
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
  const res = await fetch('/api/assets', {
    method: 'POST',
    headers: getWebHeaders(),
    body: JSON.stringify(asset),
  });
  if (!res.ok) throw new Error('Failed to add asset');
  const data = await res.json();
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
  const res = await fetch('/api/assets', {
    method: 'PUT',
    headers: getWebHeaders(),
    body: JSON.stringify(asset),
  });
  if (!res.ok) throw new Error('Failed to update asset');
  const data = await res.json();
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
  const res = await fetch(`/api/assets?id=${id}`, {
    method: 'DELETE',
    headers: getWebHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete asset');
}

export async function getAssetsTotal(): Promise<Record<string, unknown>> {
  if (isTauri()) {
    return await invoke('get_assets_total', {
      deploymentId: getDeploymentId(),
    });
  }
  const res = await fetch('/api/assets', {
    headers: getWebHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch assets total');
  return await res.json();
}
