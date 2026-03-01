// ===== CONFIG =====
const SPREADSHEET_ID = "<SHEET_ID>";
const SHEET_NAME = "expenses";
const CATEGORIES_SHEET_NAME = "categories";

// ===== ENTRY POINTS =====
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    const action = body.action;
    if (!action) return json({ error: "Missing action" });

    if (action === "addExpense") return addExpense(body);
    if (action === "deleteExpense") return deleteExpense(body);
    if (action === "addCategory") return addCategory(body);
    if (action === "deleteCategory") return deleteCategory(body);

    return json({ error: "Invalid action" });
  } catch (err) {
    return json({ error: err.toString() });
  }
}

function doGet(e) {
  try {
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

    return json({ error: "Invalid action" });
  } catch (err) {
    return json({ error: err.toString() });
  }
}

// ===== DB ACCESS =====
function getSheet(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(sheetName);
}

// ===== CATEGORY ACTIONS =====
function getCategories() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CATEGORIES_SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(CATEGORIES_SHEET_NAME);
    sheet.appendRow(["id", "name", "icon", "color"]);
    
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
  }

  const values = sheet.getDataRange().getValues();
  const categories = [];

  for (let i = 0; i < values.length; i++) {
    // Skip header row if it exists
    if (values[i][0] === "id") continue; 
    
    categories.push({
      id: values[i][0],
      name: values[i][1],
      icon: values[i][2],
      color: values[i][3]
    });
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
  const createdAt = new Date().toISOString();
  const title = expense.title || expense.Title || expense.name || expense.description || "";
  const amount = Number(expense.amount || expense.Amount || 0);
  const category = expense.category || expense.Category || "";

  sheet.appendRow([id, title, amount, category, createdAt]);
  return json({ expense: { id, title, amount, category, createdAt } });
}

function getExpenses(month = null, category = null) {
  const sheet = getSheet(SHEET_NAME);
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

// ===== AGGREGATIONS =====
function getMonthlyTotal(month) {
  if (!month) return json({ error: "Missing month YYYY-MM" });
  const sheet = getSheet(SHEET_NAME);
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

function getCategoryTotals(month = null) {
  const sheet = getSheet(SHEET_NAME);
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

// ===== RESPONSE =====
function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}