// ===== CONFIG =====
const SPREADSHEET_ID = "<SHEET_ID>";
const SHEET_NAME = "expenses";
const CATEGORIES_SHEET_NAME = "categories";
const INCOME_SHEET_NAME = "income";
const INCOME_CATEGORIES_SHEET_NAME = "income_categories";

// ===== ENTRY POINTS =====
function doPost(e) {
  try {
    ensureSheetsExist();
    const body = JSON.parse(e.postData.contents || "{}");
    const action = body.action;
    if (!action) return json({ error: "Missing action" });

    if (action === "addExpense") return addExpense(body);
    if (action === "deleteExpense") return deleteExpense(body);
    if (action === "addCategory") return addCategory(body);
    if (action === "deleteCategory") return deleteCategory(body);

    if (action === "addIncome") return addIncome(body);
    if (action === "deleteIncome") return deleteIncome(body);
    if (action === "addIncomeCategory") return addIncomeCategory(body);
    if (action === "deleteIncomeCategory") return deleteIncomeCategory(body);

    return json({ error: "Invalid action" });
  } catch (err) {
    return json({ error: err.toString() });
  }
}

function doGet(e) {
  try {
    ensureSheetsExist();
    const action = e.parameter.action;
    if (!action) return json({ error: "Missing action" });

    if (action === "getExpenses") {
      const month = e.parameter.month || null;
      const category = e.parameter.category || null;
      return getExpenses(month, category);
    }

    if (action === "getMonthlyTotal") return getMonthlyTotal(e.parameter.month);
    if (action === "getCategoryTotals") return getCategoryTotals(e.parameter.month);
    if (action === "getMonthlySummary") return getMonthlySummary(e.parameter.month);
    if (action === "getCategories") return getCategories();

    if (action === "getIncomes") {
      const month = e.parameter.month || null;
      const category = e.parameter.category || null;
      return getIncomes(month, category);
    }

    if (action === "getMonthlyIncomeTotal") return getMonthlyIncomeTotal(e.parameter.month);
    if (action === "getIncomeCategoryTotals") return getIncomeCategoryTotals(e.parameter.month);
    if (action === "getIncomeCategories") return getIncomeCategories();

    return json({ error: "Invalid action" });
  } catch (err) {
    return json({ error: err.toString() });
  }
}

// ===== AUTO CREATE SHEETS =====
function ensureSheetsExist() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  const sheetsConfig = [
    { name: SHEET_NAME, headers: ["id", "title", "amount", "category", "createdAt"] },
    { name: CATEGORIES_SHEET_NAME, headers: ["id", "name", "icon", "color"] },
    { name: INCOME_SHEET_NAME, headers: ["id", "title", "amount", "category", "createdAt"] },
    { name: INCOME_CATEGORIES_SHEET_NAME, headers: ["id", "name", "icon", "color"] }
  ];
  
  sheetsConfig.forEach(config => {
    let sheet = ss.getSheetByName(config.name);
    if (!sheet) {
      sheet = ss.insertSheet(config.name);
      sheet.appendRow(config.headers);
    }
  });
}

// ===== DB ACCESS =====
function getSheet(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(sheetName);
}

// ===== EXPENSE CATEGORY ACTIONS =====
function getCategories() {
  const sheet = getSheet(CATEGORIES_SHEET_NAME);
  if (!sheet) return json({ categories: [] });

  const values = sheet.getDataRange().getValues();
  const hasOnlyHeader = values.length === 1 || (values.length === 1 && values[0][0] === "id");
  const isEmpty = values.length === 0 || (values.length === 1 && !values[0][0]);
  
  if (hasOnlyHeader || isEmpty) {
    const defaults = [
      [Utilities.getUuid(), "Food", "🍜", "#f97316"],
      [Utilities.getUuid(), "Transport", "🚌", "#3b82f6"],
      [Utilities.getUuid(), "Entertainment", "🎬", "#8b5cf6"],
      [Utilities.getUuid(), "Health", "💊", "#4ade80"],
      [Utilities.getUuid(), "Shopping", "🛍️", "#ec4899"],
      [Utilities.getUuid(), "Bills", "📄", "#eab308"],
      [Utilities.getUuid(), "Other", "📦", "#6b7280"]
    ];
    defaults.forEach(row => sheet.appendRow(row));
    return json({ categories: defaults.map(row => ({
      id: row[0],
      name: row[1],
      icon: row[2],
      color: row[3]
    }))});
  }

  const categories = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] && values[i][0] !== "id") {
      categories.push({
        id: values[i][0],
        name: values[i][1],
        icon: values[i][2],
        color: values[i][3]
      });
    }
  }

  return json({ categories });
}

function addCategory(body) {
  const sheet = getSheet(CATEGORIES_SHEET_NAME);
  const cat = body.category;
  if (!cat || !cat.name) return json({ error: "Missing category data" });

  const id = Utilities.getUuid();
  sheet.appendRow([id, cat.name, cat.icon || "📌", cat.color || "#000000"]);
  return json({ category: { id, name: cat.name, icon: cat.icon, color: cat.color } });
}

function deleteCategory(body) {
  const sheet = getSheet(CATEGORIES_SHEET_NAME);
  const id = body.id;
  if (!id) return json({ error: "Missing category id" });

  const values = sheet.getDataRange().getValues();
  for (let i = 0; i < values.length; i++) {
    if (values[i][0] === id) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  return json({ success: true });
}

// ===== EXPENSE ACTIONS =====
function addExpense(body) {
  const sheet = getSheet(SHEET_NAME);
  const expense = body.expense || body;
  if (!expense) return json({ error: "Missing expense data" });

  const id = Utilities.getUuid();
  const createdAt = expense.date || new Date().toISOString();
  const title = expense.title || expense.Title || expense.name || expense.description || "";
  const amount = Number(expense.amount || expense.Amount || 0);
  const category = expense.category || expense.Category || "";

  sheet.appendRow([id, title, amount, category, createdAt]);
  return json({ expense: { id, title, amount, category, createdAt } });
}

function getExpenses(month, category) {
  const sheet = getSheet(SHEET_NAME);
  if (!sheet) return json({ expenses: [] });
  
  const values = sheet.getDataRange().getValues();
  const expenses = [];

  for (let i = 1; i < values.length; i++) {
    const createdAt = values[i][4];
    const date = new Date(createdAt);
    const rowMonth = date.toISOString().slice(0, 7);

    if (month && rowMonth !== month) continue;
    if (category && values[i][3] !== category) continue;

    expenses.push({
      id: values[i][0],
      title: values[i][1],
      amount: Number(values[i][2]),
      category: values[i][3],
      createdAt
    });
  }

  return json({ expenses });
}

function deleteExpense(body) {
  const sheet = getSheet(SHEET_NAME);
  const id = body.id;
  if (!id) return json({ error: "Missing id" });

  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === id) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  return json({ success: true });
}

// ===== AGGREGATIONS - EXPENSES =====
function getMonthlyTotal(month) {
  if (!month) return json({ error: "Missing month YYYY-MM" });
  const sheet = getSheet(SHEET_NAME);
  if (!sheet) return json({ month, total: 0 });
  
  const values = sheet.getDataRange().getValues();
  let total = 0;

  for (let i = 1; i < values.length; i++) {
    const createdAt = values[i][4];
    const date = new Date(createdAt);
    if (date.toISOString().slice(0, 7) === month) {
      total += Number(values[i][2]);
    }
  }

  return json({ month, total });
}

function getCategoryTotals(month) {
  const sheet = getSheet(SHEET_NAME);
  if (!sheet) return json({ categories: [] });
  
  const values = sheet.getDataRange().getValues();
  const map = {};

  for (let i = 1; i < values.length; i++) {
    const createdAt = values[i][4];
    const date = new Date(createdAt);
    if (month && date.toISOString().slice(0, 7) !== month) continue;

    const category = values[i][3] || "Uncategorized";
    const amount = Number(values[i][2]);
    map[category] = (map[category] || 0) + amount;
  }

  return json({ categories: Object.keys(map).map(cat => ({ category: cat, total: map[cat] })) });
}

function getMonthlySummary(month) {
  if (!month) return json({ error: "Missing month YYYY-MM" });
  const sheet = getSheet(SHEET_NAME);
  if (!sheet) return json({ month, total: 0, categories: [] });
  
  const values = sheet.getDataRange().getValues();
  let total = 0;
  const map = {};

  for (let i = 1; i < values.length; i++) {
    const createdAt = values[i][4];
    const date = new Date(createdAt);
    if (date.toISOString().slice(0, 7) !== month) continue;

    const amount = Number(values[i][2]);
    const category = values[i][3] || "Uncategorized";
    
    total += amount;
    map[category] = (map[category] || 0) + amount;
  }

  return json({
    month, total,
    categories: Object.entries(map).map(([c, t]) => ({ category: c, total: t }))
  });
}

// ===== INCOME CATEGORY ACTIONS =====
function getIncomeCategories() {
  const sheet = getSheet(INCOME_CATEGORIES_SHEET_NAME);
  if (!sheet) return json({ categories: [] });

  const values = sheet.getDataRange().getValues();
  const hasOnlyHeader = values.length === 1 || (values.length === 1 && values[0][0] === "id");
  const isEmpty = values.length === 0 || (values.length === 1 && !values[0][0]);
  
  if (hasOnlyHeader || isEmpty) {
    const defaults = [
      [Utilities.getUuid(), "Salary", "💼", "#22c55e"],
      [Utilities.getUuid(), "Freelance", "💻", "#3b82f6"],
      [Utilities.getUuid(), "Investment", "📈", "#8b5cf6"],
      [Utilities.getUuid(), "Gift", "🎁", "#f97316"],
      [Utilities.getUuid(), "Other", "💰", "#6b7280"]
    ];
    defaults.forEach(row => sheet.appendRow(row));
    return json({ categories: defaults.map(row => ({
      id: row[0],
      name: row[1],
      icon: row[2],
      color: row[3]
    }))});
  }

  const categories = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] && values[i][0] !== "id") {
      categories.push({
        id: values[i][0],
        name: values[i][1],
        icon: values[i][2],
        color: values[i][3]
      });
    }
  }

  return json({ categories });
}

function addIncomeCategory(body) {
  const sheet = getSheet(INCOME_CATEGORIES_SHEET_NAME);
  const cat = body.category;
  if (!cat || !cat.name) return json({ error: "Missing category data" });

  const id = Utilities.getUuid();
  sheet.appendRow([id, cat.name, cat.icon || "💰", cat.color || "#000000"]);
  return json({ category: { id, name: cat.name, icon: cat.icon, color: cat.color } });
}

function deleteIncomeCategory(body) {
  const sheet = getSheet(INCOME_CATEGORIES_SHEET_NAME);
  const id = body.id;
  if (!id) return json({ error: "Missing category id" });

  const values = sheet.getDataRange().getValues();
  for (let i = 0; i < values.length; i++) {
    if (values[i][0] === id) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  return json({ success: true });
}

// ===== INCOME ACTIONS =====
function addIncome(body) {
  const sheet = getSheet(INCOME_SHEET_NAME);
  const income = body.income || body;
  if (!income) return json({ error: "Missing income data" });

  const id = Utilities.getUuid();
  const createdAt = income.date || new Date().toISOString();
  const title = income.title || income.Title || income.name || income.description || "";
  const amount = Number(income.amount || income.Amount || 0);
  const category = income.category || income.Category || "";

  sheet.appendRow([id, title, amount, category, createdAt]);
  return json({ income: { id, title, amount, category, createdAt } });
}

function getIncomes(month, category) {
  const sheet = getSheet(INCOME_SHEET_NAME);
  if (!sheet) return json({ incomes: [] });
  
  const values = sheet.getDataRange().getValues();
  const incomes = [];

  for (let i = 1; i < values.length; i++) {
    const createdAt = values[i][4];
    const date = new Date(createdAt);
    const rowMonth = date.toISOString().slice(0, 7);

    if (month && rowMonth !== month) continue;
    if (category && values[i][3] !== category) continue;

    incomes.push({
      id: values[i][0],
      title: values[i][1],
      amount: Number(values[i][2]),
      category: values[i][3],
      createdAt
    });
  }

  return json({ incomes });
}

function deleteIncome(body) {
  const sheet = getSheet(INCOME_SHEET_NAME);
  const id = body.id;
  if (!id) return json({ error: "Missing id" });

  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === id) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  return json({ success: true });
}

// ===== AGGREGATIONS - INCOME =====
function getMonthlyIncomeTotal(month) {
  if (!month) return json({ error: "Missing month YYYY-MM" });
  const sheet = getSheet(INCOME_SHEET_NAME);
  if (!sheet) return json({ month, total: 0 });
  
  const values = sheet.getDataRange().getValues();
  let total = 0;

  for (let i = 1; i < values.length; i++) {
    const createdAt = values[i][4];
    const date = new Date(createdAt);
    if (date.toISOString().slice(0, 7) === month) {
      total += Number(values[i][2]);
    }
  }

  return json({ month, total });
}

function getIncomeCategoryTotals(month) {
  const sheet = getSheet(INCOME_SHEET_NAME);
  if (!sheet) return json({ categories: [] });
  
  const values = sheet.getDataRange().getValues();
  const map = {};

  for (let i = 1; i < values.length; i++) {
    const createdAt = values[i][4];
    const date = new Date(createdAt);
    if (month && date.toISOString().slice(0, 7) !== month) continue;

    const category = values[i][3] || "Uncategorized";
    const amount = Number(values[i][2]);
    map[category] = (map[category] || 0) + amount;
  }

  return json({ categories: Object.keys(map).map(cat => ({ category: cat, total: map[cat] })) });
}

// ===== RESPONSE =====
function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}