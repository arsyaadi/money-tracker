use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryData {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryInput {
    pub name: String,
    pub icon: String,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Expense {
    pub id: String,
    pub title: String,
    pub amount: f64,
    pub category: String,
    pub date: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExpenseInput {
    pub title: String,
    pub amount: f64,
    pub category: String,
    pub date: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Income {
    pub id: String,
    pub title: String,
    pub amount: f64,
    pub category: String,
    pub date: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IncomeInput {
    pub title: String,
    pub amount: f64,
    pub category: String,
    pub date: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Asset {
    pub id: String,
    pub name: String,
    pub amount: f64,
    pub icon: String,
    #[serde(rename = "createdAt", default)]
    pub created_at: Option<String>,
    #[serde(rename = "updatedAt", default)]
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetInput {
    pub name: String,
    pub amount: f64,
    pub icon: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetUpdateInput {
    pub id: String,
    pub name: String,
    pub amount: f64,
    pub icon: String,
}
