import csv
from collections import defaultdict

csv_pur = defaultdict(lambda: {"kg": 0.0, "amt": 0.0})
csv_sales = defaultdict(lambda: {"kg": 0.0, "amt": 0.0})

with open("data/operation_transactions.csv", "r", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        if row.get("type", "").strip() == "PURCHASE":
            m = row["date"][:7]
            csv_pur[m]["kg"] += float(row.get("weight", 0) or 0)
            csv_pur[m]["amt"] += float(row.get("amount", 0) or 0)

with open("data/customer_transactions.csv", "r", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        if row.get("type", "").strip() == "SALE":
            m = row["date"][:7]
            csv_sales[m]["kg"] += float(row.get("weight", 0) or 0)
            csv_sales[m]["amt"] += float(row.get("amount", 0) or 0)

months = sorted(list(set(list(csv_pur.keys()) + list(csv_sales.keys()))))

current_kg = 24203.0
current_val = 216616.85

header = f"| {'Month':<7} | {'Opening (Kg)':>12} | {'Purchases (Kg)':>14} | {'Sales (Kg)':>12} | {'Closing (Kg)':>12} | {'Closing Value (₹)':>18} |"
print("=" * len(header))
print(header)
print("=" * len(header))

for m in months:
    p_kg = csv_pur[m]["kg"]
    p_amt = csv_pur[m]["amt"]
    s_kg = csv_sales[m]["kg"]
    s_amt = csv_sales[m]["amt"]
    
    tot_kg = current_kg + p_kg
    tot_val = current_val + p_amt
    w_avg_rate = tot_val / tot_kg if tot_kg > 0 else 0
    
    closing_kg = tot_kg - s_kg
    closing_val = closing_kg * w_avg_rate
    
    print(f"| {m:<7} | {current_kg:12,.1f} | {p_kg:14,.1f} | {s_kg:12,.1f} | {closing_kg:12,.1f} | ₹{closing_val:16,.2f} |")
    
    current_kg = closing_kg
    current_val = closing_val

print("=" * len(header))
