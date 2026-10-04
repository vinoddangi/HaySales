import json, csv
from collections import defaultdict
from datetime import datetime

with open("backups/allGoogleSheetsDump.json", "r") as f:
    sheets = json.load(f)

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
        v_clean = v.replace("₹", "").replace(",", "").strip()
        try: return float(v_clean)
        except: return 0.0
    return 0.0

sheet_data = {}
for s in sheets:
    title = s.get("title") or s.get("declaredName") or ""
    mkey = month_key(title)
    if not mkey: continue
    
    op_cl = s.get("tabs", {}).get("Opening/Closing", {})
    op_lending = 0.0
    cl_lending = 0.0
    for r in op_cl.get("rows", []):
        if not r: continue
        r_str = " ".join([str(c) for c in r]).lower()
        if "opening lending to customer" in r_str:
            for c in r:
                val = parse_val(c)
                if val > 100000:
                    op_lending = val
                    break
        elif "lending to customer" in r_str and op_lending > 0 and cl_lending == 0:
            for c in r:
                val = parse_val(c)
                if val > 100000 and val != op_lending:
                    cl_lending = val
                    break

    main_tab = s.get("tabs", {}).get("Main", {})
    for r in main_tab.get("rows", []):
        if not r: continue
        r_str = " ".join([str(c) for c in r]).lower()
        if "lending to customer" in r_str:
            for c in r:
                val = parse_val(c)
                if val > 100000:
                    cl_lending = val
                    break

    sheet_data[mkey] = {
        "op_lending": op_lending,
        "cl_lending": cl_lending,
        "net_change": cl_lending - op_lending
    }

csv_monthly = defaultdict(lambda: {"opening_due": 0.0, "sale_total": 0.0, "sale_cash": 0.0, "sale_debt": 0.0, "payment": 0.0})
with open("data/customer_transactions.csv", "r", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        m = row["date"][:7]
        ttype = row["type"]
        amt = float(row.get("amount", 0) or 0)
        cash = float(row.get("cashPaid", 0) or 0)
        rem = float(row.get("remainingDue", 0) or 0)
        if ttype == "OPENING_DUE":
            csv_monthly[m]["opening_due"] += amt
        elif ttype == "SALE":
            csv_monthly[m]["sale_total"] += amt
            csv_monthly[m]["sale_cash"] += cash
            csv_monthly[m]["sale_debt"] += rem
        elif ttype == "PAYMENT":
            csv_monthly[m]["payment"] += amt

months = sorted(list(sheet_data.keys()))
header = f"| {'Month':<7} | {'Sheet Op Lending':>16} | {'Sheet Cl Lending':>16} | {'CSV Sales Debt':>14} | {'CSV Payments':>12} | {'CSV Net Change':>14} | {'Sheet Net Change':>16} | {'Diff':>10} |"
print("=" * len(header))
print(header)
print("=" * len(header))

for m in months:
    sd = sheet_data[m]
    cm = csv_monthly[m]
    csv_net = cm["sale_debt"] - cm["payment"]
    net_diff = csv_net - sd["net_change"]
    diff_str = f"{net_diff:+,.2f}" if abs(net_diff) > 0.01 else "0.00"
    print(f"| {m:<7} | ₹{sd['op_lending']:14,.2f} | ₹{sd['cl_lending']:14,.2f} | ₹{cm['sale_debt']:12,.2f} | ₹{cm['payment']:10,.2f} | ₹{csv_net:12,.2f} | ₹{sd['net_change']:14,.2f} | {diff_str:>10} |")
print("=" * len(header))
