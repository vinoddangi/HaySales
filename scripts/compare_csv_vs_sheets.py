import json, csv
from collections import defaultdict
from datetime import datetime

with open("backups/allGoogleSheetsDump.json", "r") as f:
    sheets_data = json.load(f)

def month_key(title):
    t = title.replace("March", "Mar").replace("June", "Jun").replace("July", "Jul").replace("Aug", "Aug").replace("Sep", "Sep").replace("Oct", "Oct").replace("Nov", "Nov").replace("Dec", "Dec")
    parts = t.split()
    if len(parts) < 2: return None
    mon_str = parts[0][:3]
    yr = parts[-1]
    try:
        dt = datetime.strptime(f"{mon_str} {yr}", "%b %Y")
        return dt.strftime("%Y-%m")
    except:
        return None

def parse_val(v):
    if isinstance(v, (int, float)): return float(v)
    if isinstance(v, str):
        v_clean = v.replace("₹", "").replace("kg", "").replace(",", "").strip()
        try: return float(v_clean)
        except: return 0.0
    return 0.0

sheet_monthly = {}
for sheet in sheets_data:
    title = sheet.get("title") or sheet.get("declaredName") or ""
    mkey = month_key(title)
    if not mkey: continue
    tabs = sheet.get("tabs", {})
    main_tab = tabs.get("Main", {})
    
    rows = main_tab.get("rows", [])
    op_kg, op_amt = 0, 0
    pur_kg, pur_amt = 0, 0
    sales_kg, sales_amt = 0, 0
    cl_kg, cl_amt = 0, 0

    for r in rows:
        if not r or len(r) < 2: continue
        label = str(r[0]).strip().lower()
        if "opening stock" in label:
            op_kg = parse_val(r[1]) if len(r) > 1 else 0
            op_amt = parse_val(r[3]) if len(r) > 3 else (parse_val(r[2]) if len(r) > 2 else 0)
        elif "purchange" in label or "purchase" in label:
            pur_kg = parse_val(r[1]) if len(r) > 1 else 0
            pur_amt = parse_val(r[3]) if len(r) > 3 else (parse_val(r[2]) if len(r) > 2 else 0)
        elif "sales" in label and not "grass sales" in label:
            sales_kg = parse_val(r[1]) if len(r) > 1 else 0
            sales_amt = parse_val(r[3]) if len(r) > 3 else (parse_val(r[2]) if len(r) > 2 else 0)
        elif "closing stock" in label:
            cl_kg = parse_val(r[1]) if len(r) > 1 else 0
            cl_amt = parse_val(r[3]) if len(r) > 3 else (parse_val(r[2]) if len(r) > 2 else 0)

    sheet_monthly[mkey] = {
        "title": title,
        "op_kg": op_kg,
        "op_amt": op_amt,
        "pur_kg": pur_kg,
        "pur_amt": pur_amt,
        "sales_kg": sales_kg,
        "sales_amt": sales_amt,
        "cl_kg": cl_kg,
        "cl_amt": cl_amt
    }

csv_pur = defaultdict(lambda: {"kg": 0.0, "amt": 0.0, "count": 0})
csv_sales = defaultdict(lambda: {"kg": 0.0, "amt": 0.0, "count": 0})

# 1. Operation transactions (Purchases)
with open("data/operation_transactions.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        tx_type = row.get("type", "").strip()
        date_str = row.get("date", "").strip()
        if not date_str: continue
        mkey = date_str[:7]
        wt = float(row.get("weight", 0) or 0)
        amt = float(row.get("amount", 0) or 0)

        if tx_type == "PURCHASE":
            csv_pur[mkey]["kg"] += wt
            csv_pur[mkey]["amt"] += amt
            csv_pur[mkey]["count"] += 1
        elif tx_type == "SALE":
            csv_sales[mkey]["kg"] += wt
            csv_sales[mkey]["amt"] += amt
            csv_sales[mkey]["count"] += 1

# 2. Customer transactions (Sales)
with open("data/customer_transactions.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        tx_type = row.get("type", "").strip()
        date_str = row.get("date", "").strip()
        if not date_str: continue
        mkey = date_str[:7]
        wt = float(row.get("weight", 0) or 0)
        amt = float(row.get("amount", 0) or 0)

        if tx_type == "SALE":
            csv_sales[mkey]["kg"] += wt
            csv_sales[mkey]["amt"] += amt
            csv_sales[mkey]["count"] += 1
        elif tx_type == "PURCHASE":
            csv_pur[mkey]["kg"] += wt
            csv_pur[mkey]["amt"] += amt
            csv_pur[mkey]["count"] += 1

all_months = sorted(list(set(list(sheet_monthly.keys()) + list(csv_pur.keys()) + list(csv_sales.keys()))))

header = f"| {'Month':<7} | {'Sheet Pur Kg':>12} | {'CSV Pur Kg':>12} | {'Pur Diff Kg':>12} | {'Sheet Sale Kg':>14} | {'CSV Sale Kg':>13} | {'Sale Diff Kg':>13} | {'Pur Amt Diff':>13} | {'Sale Amt Diff':>13} |"
print("=" * len(header))
print(header)
print("=" * len(header))

for m in all_months:
    sh = sheet_monthly.get(m, {"pur_kg": 0, "sales_kg": 0, "pur_amt": 0, "sales_amt": 0, "op_kg": 0, "cl_kg": 0})
    cp = csv_pur.get(m, {"kg": 0, "amt": 0})
    cs = csv_sales.get(m, {"kg": 0, "amt": 0})

    diff_pur_kg = cp["kg"] - sh["pur_kg"]
    diff_sale_kg = cs["kg"] - sh["sales_kg"]
    diff_pur_amt = cp["amt"] - sh["pur_amt"]
    diff_sale_amt = cs["amt"] - sh["sales_amt"]

    diff_pur_str = f"{diff_pur_kg:+,.1f}" if abs(diff_pur_kg) > 0.01 else "0"
    diff_sale_str = f"{diff_sale_kg:+,.1f}" if abs(diff_sale_kg) > 0.01 else "0"
    diff_p_amt_str = f"{diff_pur_amt:+,.2f}" if abs(diff_pur_amt) > 0.01 else "0"
    diff_s_amt_str = f"{diff_sale_amt:+,.2f}" if abs(diff_sale_amt) > 0.01 else "0"

    sh_p_kg = sh["pur_kg"]
    cp_kg = cp["kg"]
    sh_s_kg = sh["sales_kg"]
    cs_kg = cs["kg"]

    print(f"| {m:<7} | {sh_p_kg:12,.1f} | {cp_kg:12,.1f} | {diff_pur_str:>12} | {sh_s_kg:14,.1f} | {cs_kg:13,.1f} | {diff_sale_str:>13} | {diff_p_amt_str:>13} | {diff_s_amt_str:>13} |")
print("=" * len(header))
