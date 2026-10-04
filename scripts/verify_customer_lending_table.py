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

sheet_lending = {}
for s in sheets:
    title = s.get("title") or s.get("declaredName") or ""
    mkey = month_key(title)
    if not mkey: continue
    
    main_tab = s.get("tabs", {}).get("Main", {})
    lending_val = 0.0
    for r in main_tab.get("rows", []):
        if not r: continue
        row_str = " ".join([str(c) for c in r]).lower()
        if "lending to customer" in row_str:
            for c in r:
                val = parse_val(c)
                if val > 100000:
                    lending_val = val
                    break
    if lending_val == 0.0:
        op_cl = s.get("tabs", {}).get("Opening/Closing", {})
        for r in op_cl.get("rows", []):
            row_str = " ".join([str(c) for c in r]).lower()
            if "lending to customer" in row_str:
                for c in r:
                    val = parse_val(c)
                    if val > 100000:
                        lending_val = val
                        break
    sheet_lending[mkey] = lending_val

txs = []
with open("data/customer_transactions.csv", "r", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        txs.append(row)

months = sorted(list(sheet_lending.keys()))
header = f"| {'Month':<7} | {'Google Sheet (Lending)':>22} | {'App Total Due':>16} | {'Diff':>14} | {'Status':<12} |"
print("=" * len(header))
print(header)
print("=" * len(header))

for m in months:
    cutoff = m + "-31"
    cust_bal = defaultdict(float)
    for t in txs:
        if t["date"] > cutoff: continue
        cid = t["customerId"]
        ttype = t["type"]
        amt = float(t.get("amount", 0) or 0)
        cash = float(t.get("cashPaid", 0) or 0)
        
        if ttype == "OPENING_DUE":
            cust_bal[cid] += amt
        elif ttype == "SALE":
            cust_bal[cid] += (amt - cash)
        elif ttype == "PAYMENT":
            cust_bal[cid] -= amt

    total_outstanding = sum(cust_bal.values())
    sh_val = sheet_lending[m]
    diff = total_outstanding - sh_val
    diff_str = f"{diff:+,.2f}" if abs(diff) > 0.01 else "0.00"
    status = "Exact Match" if abs(diff) <= 0.01 else "Variance"
    print(f"| {m:<7} | ₹{sh_val:20,.2f} | ₹{total_outstanding:14,.2f} | {diff_str:>14} | {status:<12} |")

print("=" * len(header))
