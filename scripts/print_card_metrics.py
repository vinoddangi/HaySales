import json, csv
from collections import defaultdict

with open("data/customers.csv", "r", encoding="utf-8") as f:
    customers = list(csv.DictReader(f))

with open("data/customer_transactions.csv", "r", encoding="utf-8") as f:
    cust_txs = list(csv.DictReader(f))

all_months = sorted(list(set(t["date"][:7] for t in cust_txs)))

header = f"| {'Month':<7} | {'Total Receivables':>18} | {'Prev Receivables':>18} | {'Tenor Diff':>14} | {'Credit Added':>14} | {'Collections':>13} | {'Net Change':>13} |"
print("=" * len(header))
print(header)
print("=" * len(header))

for idx, m in enumerate(all_months):
    to_d = m + "-31"
    cur_txs = [t for t in cust_txs if t["date"] <= to_d]
    
    if idx == 0:
        prev_txs = []
    else:
        prev_m = all_months[idx-1]
        prev_txs = [t for t in cust_txs if t["date"] <= prev_m + "-31"]
        
    p_txs = [t for t in cust_txs if t["date"].startswith(m)]
    
    cust_map = defaultdict(lambda: {"op": 0.0, "sale": 0.0, "srv": 0.0, "paid": 0.0, "disc": 0.0})
    for t in cur_txs:
        cid = t["customerId"]
        tt = t["type"]
        a = float(t.get("amount", 0) or 0)
        c = float(t.get("cashPaid", 0) or 0)
        d = float(t.get("discount", 0) or 0)
        if tt == "OPENING_DUE": cust_map[cid]["op"] += a
        elif tt == "SALE":
            cust_map[cid]["sale"] += a
            cust_map[cid]["paid"] += c
            cust_map[cid]["disc"] += d
        elif tt == "SERVICE":
            cust_map[cid]["srv"] += a
            cust_map[cid]["paid"] += c
            cust_map[cid]["disc"] += d
        elif tt == "PAYMENT":
            cust_map[cid]["paid"] += a
            cust_map[cid]["disc"] += d
    tot_out = round(sum(r["op"] + r["sale"] + r["srv"] - r["paid"] - r["disc"] for r in cust_map.values()))
    
    prev_map = defaultdict(lambda: {"op": 0.0, "sale": 0.0, "srv": 0.0, "paid": 0.0, "disc": 0.0})
    for t in prev_txs:
        cid = t["customerId"]
        tt = t["type"]
        a = float(t.get("amount", 0) or 0)
        c = float(t.get("cashPaid", 0) or 0)
        d = float(t.get("discount", 0) or 0)
        if tt == "OPENING_DUE": prev_map[cid]["op"] += a
        elif tt == "SALE":
            prev_map[cid]["sale"] += a
            prev_map[cid]["paid"] += c
            prev_map[cid]["disc"] += d
        elif tt == "SERVICE":
            prev_map[cid]["srv"] += a
            prev_map[cid]["paid"] += c
            prev_map[cid]["disc"] += d
        elif tt == "PAYMENT":
            prev_map[cid]["paid"] += a
            prev_map[cid]["disc"] += d
    prev_out = round(sum(r["op"] + r["sale"] + r["srv"] - r["paid"] - r["disc"] for r in prev_map.values())) if prev_txs else 0
    
    tenor_diff = tot_out - prev_out if prev_txs else 0
    
    cr_add = round(sum(float(t.get("remainingDue", 0) or 0) for t in p_txs if t["type"] in ("SALE", "SERVICE")))
    coll = round(sum(float(t.get("amount", 0) or 0) for t in p_txs if t["type"] == "PAYMENT"))
    net = cr_add - coll
    
    print(f"| {m:<7} | ₹{tot_out:16,d} | ₹{prev_out:16,d} | ₹{tenor_diff:12,d} | ₹{cr_add:12,d} | ₹{coll:11,d} | ₹{net:11,d} |")
print("=" * len(header))
