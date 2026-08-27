pub mod google_sheets;
pub mod models;

use google_sheets::{
    add_asset, add_category, add_expense, add_income, add_income_category, delete_asset,
    delete_category, delete_expense, delete_income, delete_income_category, get_assets,
    get_assets_total, get_categories, get_category_totals, get_expenses,
    get_income_category_totals, get_income_categories, get_incomes, get_monthly_income_total,
    get_monthly_summary, get_monthly_total, update_asset,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_categories,
            add_category,
            delete_category,
            get_expenses,
            add_expense,
            delete_expense,
            get_monthly_summary,
            get_category_totals,
            get_monthly_total,
            get_income_categories,
            add_income_category,
            delete_income_category,
            get_incomes,
            add_income,
            delete_income,
            get_monthly_income_total,
            get_income_category_totals,
            get_assets,
            add_asset,
            update_asset,
            delete_asset,
            get_assets_total,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
