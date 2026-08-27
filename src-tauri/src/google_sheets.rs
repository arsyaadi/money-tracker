use std::collections::HashMap;
use reqwest::Client;
use serde_json::Value;

use crate::models::{
    Asset, AssetInput, AssetUpdateInput, CategoryData, CategoryInput, Expense, ExpenseInput,
    Income, IncomeInput,
};

fn normalize_date_only(val: &str) -> String {
    if val.len() >= 10 && val.chars().nth(4) == Some('-') && val.chars().nth(7) == Some('-') {
        return val[0..10].to_string();
    }
    val.to_string()
}

fn get_apps_script_url(deployment_id: Option<String>) -> Result<String, String> {
    if let Some(id) = deployment_id {
        let trimmed = id.trim();
        if !trimmed.is_empty() {
            if trimmed.starts_with("http") {
                if let Some(pos) = trimmed.find("/s/") {
                    let after_s = &trimmed[pos + 3..];
                    let end_pos = after_s.find('/').unwrap_or(after_s.len());
                    let dep_id = &after_s[..end_pos];
                    return Ok(format!("https://script.google.com/macros/s/{}/exec", dep_id));
                }
                return Ok(trimmed.to_string());
            }
            return Ok(format!("https://script.google.com/macros/s/{}/exec", trimmed));
        }
    }

    if let Ok(env_url) = std::env::var("APPS_SCRIPT_URL") {
        if !env_url.trim().is_empty() {
            return Ok(env_url);
        }
    }

    Err("Missing APPS_SCRIPT_URL or Deployment ID. Please configure it in Settings.".to_string())
}

async fn apps_script_get(
    params: HashMap<&str, &str>,
    deployment_id: Option<String>,
) -> Result<Value, String> {
    let base_url = get_apps_script_url(deployment_id)?;
    let client = Client::builder()
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()
        .map_err(|e| e.to_string())?;

    let res = client
        .get(&base_url)
        .query(&params)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let text = res.text().await.map_err(|e| e.to_string())?;
    let data: Value = serde_json::from_str(&text)
        .map_err(|_| "Invalid JSON response from Google Apps Script".to_string())?;

    if let Some(err) = data.get("error").and_then(|e| e.as_str()) {
        return Err(err.to_string());
    }

    Ok(data)
}

async fn apps_script_post(
    body: Value,
    deployment_id: Option<String>,
) -> Result<Value, String> {
    let base_url = get_apps_script_url(deployment_id)?;
    let client = Client::builder()
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()
        .map_err(|e| e.to_string())?;

    let body_str = serde_json::to_string(&body).map_err(|e| e.to_string())?;

    let res = client
        .post(&base_url)
        .header("Content-Type", "text/plain")
        .body(body_str)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let text = res.text().await.map_err(|e| e.to_string())?;
    let data: Value = serde_json::from_str(&text)
        .map_err(|_| "Invalid JSON response from Google Apps Script".to_string())?;

    if let Some(err) = data.get("error").and_then(|e| e.as_str()) {
        return Err(err.to_string());
    }

    Ok(data)
}

// ===== CATEGORIES =====
#[tauri::command]
pub async fn get_categories(deployment_id: Option<String>) -> Result<Vec<CategoryData>, String> {
    let mut params = HashMap::new();
    params.insert("action", "getCategories");

    let val = apps_script_get(params, deployment_id).await?;
    let cats = val.get("categories").cloned().unwrap_or(Value::Array(vec![]));
    serde_json::from_value(cats).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_category(
    category: CategoryInput,
    deployment_id: Option<String>,
) -> Result<CategoryData, String> {
    let body = serde_json::json!({
        "action": "addCategory",
        "category": category
    });
    let val = apps_script_post(body, deployment_id).await?;
    let cat = val.get("category").ok_or("Missing category in response")?.clone();
    serde_json::from_value(cat).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_category(id: String, deployment_id: Option<String>) -> Result<bool, String> {
    let body = serde_json::json!({
        "action": "deleteCategory",
        "id": id
    });
    apps_script_post(body, deployment_id).await?;
    Ok(true)
}

// ===== EXPENSES =====
#[tauri::command]
pub async fn get_expenses(
    month: Option<String>,
    category: Option<String>,
    deployment_id: Option<String>,
) -> Result<Vec<Expense>, String> {
    let mut params = HashMap::new();
    params.insert("action", "getExpenses");
    if let Some(ref m) = month {
        params.insert("month", m.as_str());
    }
    if let Some(ref c) = category {
        params.insert("category", c.as_str());
    }

    let val = apps_script_get(params, deployment_id).await?;
    let expenses_raw = val.get("expenses").and_then(|e| e.as_array()).cloned().unwrap_or_default();

    let mut expenses = Vec::new();
    for item in expenses_raw {
        let id = item.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let title = item.get("title").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let amount = item.get("amount").and_then(|v| v.as_f64()).unwrap_or(0.0);
        let category = item.get("category").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let date_raw = item
            .get("date")
            .or_else(|| item.get("createdAt"))
            .and_then(|v| v.as_str())
            .unwrap_or("");
        let date = normalize_date_only(date_raw);

        expenses.push(Expense {
            id,
            title,
            amount,
            category,
            date,
        });
    }

    Ok(expenses)
}

#[tauri::command]
pub async fn add_expense(
    expense: ExpenseInput,
    deployment_id: Option<String>,
) -> Result<Expense, String> {
    let target_date = expense.date.clone();
    let body = serde_json::json!({
        "action": "addExpense",
        "expense": expense
    });
    let val = apps_script_post(body, deployment_id).await?;
    let created = val.get("expense").ok_or("Missing expense in response")?;

    let id = created.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let title = created.get("title").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let amount = created.get("amount").and_then(|v| v.as_f64()).unwrap_or(0.0);
    let category = created.get("category").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let created_at = created.get("createdAt").and_then(|v| v.as_str()).unwrap_or("");
    let mut date = normalize_date_only(created_at);
    if date.is_empty() {
        date = target_date;
    }

    Ok(Expense {
        id,
        title,
        amount,
        category,
        date,
    })
}

#[tauri::command]
pub async fn delete_expense(id: String, deployment_id: Option<String>) -> Result<bool, String> {
    let body = serde_json::json!({
        "action": "deleteExpense",
        "id": id
    });
    apps_script_post(body, deployment_id).await?;
    Ok(true)
}

#[tauri::command]
pub async fn get_monthly_summary(
    month: String,
    deployment_id: Option<String>,
) -> Result<Value, String> {
    let mut params = HashMap::new();
    params.insert("action", "getMonthlySummary");
    params.insert("month", month.as_str());
    apps_script_get(params, deployment_id).await
}

#[tauri::command]
pub async fn get_category_totals(
    month: Option<String>,
    deployment_id: Option<String>,
) -> Result<Value, String> {
    let mut params = HashMap::new();
    params.insert("action", "getCategoryTotals");
    if let Some(ref m) = month {
        params.insert("month", m.as_str());
    }
    apps_script_get(params, deployment_id).await
}

#[tauri::command]
pub async fn get_monthly_total(
    month: String,
    deployment_id: Option<String>,
) -> Result<Value, String> {
    let mut params = HashMap::new();
    params.insert("action", "getMonthlyTotal");
    params.insert("month", month.as_str());
    apps_script_get(params, deployment_id).await
}

// ===== INCOME CATEGORIES =====
#[tauri::command]
pub async fn get_income_categories(
    deployment_id: Option<String>,
) -> Result<Vec<CategoryData>, String> {
    let mut params = HashMap::new();
    params.insert("action", "getIncomeCategories");

    let val = apps_script_get(params, deployment_id).await?;
    let cats = val.get("categories").cloned().unwrap_or(Value::Array(vec![]));
    serde_json::from_value(cats).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_income_category(
    category: CategoryInput,
    deployment_id: Option<String>,
) -> Result<CategoryData, String> {
    let body = serde_json::json!({
        "action": "addIncomeCategory",
        "category": category
    });
    let val = apps_script_post(body, deployment_id).await?;
    let cat = val.get("category").ok_or("Missing category in response")?.clone();
    serde_json::from_value(cat).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_income_category(
    id: String,
    deployment_id: Option<String>,
) -> Result<bool, String> {
    let body = serde_json::json!({
        "action": "deleteIncomeCategory",
        "id": id
    });
    apps_script_post(body, deployment_id).await?;
    Ok(true)
}

// ===== INCOMES =====
#[tauri::command]
pub async fn get_incomes(
    month: Option<String>,
    category: Option<String>,
    deployment_id: Option<String>,
) -> Result<Vec<Income>, String> {
    let mut params = HashMap::new();
    params.insert("action", "getIncomes");
    if let Some(ref m) = month {
        params.insert("month", m.as_str());
    }
    if let Some(ref c) = category {
        params.insert("category", c.as_str());
    }

    let val = apps_script_get(params, deployment_id).await?;
    let incomes_raw = val.get("incomes").and_then(|e| e.as_array()).cloned().unwrap_or_default();

    let mut incomes = Vec::new();
    for item in incomes_raw {
        let id = item.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let title = item.get("title").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let amount = item.get("amount").and_then(|v| v.as_f64()).unwrap_or(0.0);
        let category = item.get("category").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let date_raw = item
            .get("date")
            .or_else(|| item.get("createdAt"))
            .and_then(|v| v.as_str())
            .unwrap_or("");
        let date = normalize_date_only(date_raw);

        incomes.push(Income {
            id,
            title,
            amount,
            category,
            date,
        });
    }

    Ok(incomes)
}

#[tauri::command]
pub async fn add_income(
    income: IncomeInput,
    deployment_id: Option<String>,
) -> Result<Income, String> {
    let target_date = income.date.clone();
    let body = serde_json::json!({
        "action": "addIncome",
        "income": income
    });
    let val = apps_script_post(body, deployment_id).await?;
    let created = val.get("income").ok_or("Missing income in response")?;

    let id = created.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let title = created.get("title").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let amount = created.get("amount").and_then(|v| v.as_f64()).unwrap_or(0.0);
    let category = created.get("category").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let created_at = created.get("createdAt").and_then(|v| v.as_str()).unwrap_or("");
    let mut date = normalize_date_only(created_at);
    if date.is_empty() {
        date = target_date;
    }

    Ok(Income {
        id,
        title,
        amount,
        category,
        date,
    })
}

#[tauri::command]
pub async fn delete_income(id: String, deployment_id: Option<String>) -> Result<bool, String> {
    let body = serde_json::json!({
        "action": "deleteIncome",
        "id": id
    });
    apps_script_post(body, deployment_id).await?;
    Ok(true)
}

#[tauri::command]
pub async fn get_monthly_income_total(
    month: String,
    deployment_id: Option<String>,
) -> Result<Value, String> {
    let mut params = HashMap::new();
    params.insert("action", "getMonthlyIncomeTotal");
    params.insert("month", month.as_str());
    apps_script_get(params, deployment_id).await
}

#[tauri::command]
pub async fn get_income_category_totals(
    month: Option<String>,
    deployment_id: Option<String>,
) -> Result<Value, String> {
    let mut params = HashMap::new();
    params.insert("action", "getIncomeCategoryTotals");
    if let Some(ref m) = month {
        params.insert("month", m.as_str());
    }
    apps_script_get(params, deployment_id).await
}

// ===== ASSETS =====
#[tauri::command]
pub async fn get_assets(deployment_id: Option<String>) -> Result<Vec<Asset>, String> {
    let mut params = HashMap::new();
    params.insert("action", "getAssets");

    let val = apps_script_get(params, deployment_id).await?;
    let assets_raw = val.get("assets").and_then(|e| e.as_array()).cloned().unwrap_or_default();

    let mut assets = Vec::new();
    for item in assets_raw {
        let id = item.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let name = item.get("name").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let amount = match item.get("amount") {
            Some(Value::Number(n)) => n.as_f64().unwrap_or(0.0),
            Some(Value::String(s)) => s.parse::<f64>().unwrap_or(0.0),
            _ => 0.0,
        };
        let icon = item.get("icon").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let created_at = item.get("createdAt").and_then(|v| v.as_str()).map(|s| s.to_string());
        let updated_at = item.get("updatedAt").and_then(|v| v.as_str()).map(|s| s.to_string());

        assets.push(Asset {
            id,
            name,
            amount,
            icon,
            created_at,
            updated_at,
        });
    }

    Ok(assets)
}

#[tauri::command]
pub async fn add_asset(
    asset: AssetInput,
    deployment_id: Option<String>,
) -> Result<Asset, String> {
    let body = serde_json::json!({
        "action": "addAsset",
        "asset": asset
    });
    let val = apps_script_post(body, deployment_id).await?;
    let created = val.get("asset").ok_or("Missing asset in response")?;

    let id = created.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let name = created.get("name").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let amount = match created.get("amount") {
        Some(Value::Number(n)) => n.as_f64().unwrap_or(0.0),
        Some(Value::String(s)) => s.parse::<f64>().unwrap_or(0.0),
        _ => 0.0,
    };
    let icon = created.get("icon").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let created_at = created.get("createdAt").and_then(|v| v.as_str()).map(|s| s.to_string());
    let updated_at = created.get("updatedAt").and_then(|v| v.as_str()).map(|s| s.to_string());

    Ok(Asset {
        id,
        name,
        amount,
        icon,
        created_at,
        updated_at,
    })
}

#[tauri::command]
pub async fn update_asset(
    asset: AssetUpdateInput,
    deployment_id: Option<String>,
) -> Result<Asset, String> {
    let body = serde_json::json!({
        "action": "updateAsset",
        "asset": asset
    });
    let val = apps_script_post(body, deployment_id).await?;
    let updated = val.get("asset").ok_or("Missing asset in response")?;

    let id = updated.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let name = updated.get("name").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let amount = match updated.get("amount") {
        Some(Value::Number(n)) => n.as_f64().unwrap_or(0.0),
        Some(Value::String(s)) => s.parse::<f64>().unwrap_or(0.0),
        _ => 0.0,
    };
    let icon = updated.get("icon").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let created_at = updated.get("createdAt").and_then(|v| v.as_str()).map(|s| s.to_string());
    let updated_at = updated.get("updatedAt").and_then(|v| v.as_str()).map(|s| s.to_string());

    Ok(Asset {
        id,
        name,
        amount,
        icon,
        created_at,
        updated_at,
    })
}

#[tauri::command]
pub async fn delete_asset(id: String, deployment_id: Option<String>) -> Result<bool, String> {
    let body = serde_json::json!({
        "action": "deleteAsset",
        "id": id
    });
    apps_script_post(body, deployment_id).await?;
    Ok(true)
}

#[tauri::command]
pub async fn get_assets_total(deployment_id: Option<String>) -> Result<Value, String> {
    let mut params = HashMap::new();
    params.insert("action", "getAssetsTotal");
    apps_script_get(params, deployment_id).await
}
