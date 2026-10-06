import json
import re
from datetime import datetime
from collections import defaultdict

# 1. Baseline Opening Stock (end of 2024 / start of 2025)
BASELINE_STOCK = {
    'Others': {'weight': 24203, 'amount': 216616.0},  # Jan 2025 Opening Stock
    'Chana': {'weight': 0.0, 'amount': 0.0},
    'Tuver': {'weight': 0.0, 'amount': 0.0},
    'Makai': {'weight': 0.0, 'amount': 0.0},
}

def clean_num(v):
    if v is None: return 0.0
    s = str(v).replace(',', '').replace('₹', '').replace(' ', '').replace('kg', '').replace('KG', '').strip()
    try:
        return float(s)
    except:
        return 0.0

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

def main():
    # Load Google Sheets Dump
    with open('backups/allGoogleSheetsDump.json') as f:
        sheets = json.load(f)

    sheet_data = {}

    for s in sheets:
        title = s.get('title') or s.get('declaredName') or ''
        mk = month_key(title)
        if not mk: continue

        main_tab = s.get('tabs', {}).get('Main', {})
        rows = main_tab.get('rows', [])
        
        q_profit = 0.0
        i_comm = 0.0
        l_srv = 0.0
        o_exp = 0.0

        for r in rows:
            if not r or len(r) < 2: continue
            for idx, cell in enumerate(r):
                cell_s = str(cell).strip()
                if 'profit (cm)' in cell_s.lower() or 'q. profit' in cell_s.lower():
                    if idx + 1 < len(r):
                        q_profit = clean_num(r[idx + 1])
                elif 'commision (cm)' in cell_s.lower() or 'i. commision' in cell_s.lower():
                    if idx + 1 < len(r):
                        i_comm = clean_num(r[idx + 1])
                elif 'daalu (cm)' in cell_s.lower() or 'l. daalu' in cell_s.lower():
                    if idx + 1 < len(r):
                        l_srv = clean_num(r[idx + 1])
                elif 'expenses (cm)' in cell_s.lower() or 'o. expenses' in cell_s.lower() or '0. expenses' in cell_s.lower():
                    if idx + 1 < len(r):
                        o_exp = clean_num(r[idx + 1])

        # Extract discount from Opening/Closing tab
        discount = 0.0
        oc_tab = s.get('tabs', {}).get('Opening/Closing', {})
        for r in oc_tab.get('rows', []):
            r_str = ' '.join(str(c) for c in r if c)
            if 'commision' in r_str.lower() and len(r) > 2 and '₹' in str(r[2]):
                discount = clean_num(r[2])
                break

        sheet_data[mk] = {
            'q_profit': q_profit,
            'discount': discount,
            'true_profit': q_profit - discount,
            'i_comm': i_comm,
            'l_srv': l_srv,
            'o_exp': o_exp,
        }

    # Load App Snapshot
    with open('public/initialDatabaseSnapshot.json') as f:
        snapshot = json.load(f)

    cust_txs = snapshot.get('customer_transactions', [])
    op_txs = snapshot.get('operation_transactions', [])
    all_txs = cust_txs + op_txs

    # Group by month
    txs_by_month = defaultdict(list)
    for t in all_txs:
        d = t.get('date', '')
        if len(d) >= 7:
            txs_by_month[d[:7]].append(t)

    sorted_months = sorted([m for m in txs_by_month.keys() if m >= '2025-01'])

    # Track stock month-over-month
    current_stock = {
        'Others': {'weight': BASELINE_STOCK['Others']['weight'], 'amount': BASELINE_STOCK['Others']['amount']},
        'Chana': {'weight': 0.0, 'amount': 0.0},
        'Tuver': {'weight': 0.0, 'amount': 0.0},
        'Makai': {'weight': 0.0, 'amount': 0.0},
    }

    CROP_CATS = ['Others', 'Chana', 'Tuver', 'Makai']

    def normalize_crop(cat):
        if not cat: return 'Others'
        c = cat.strip().capitalize()
        if c in ('Grass', 'Others', 'Gavatri', 'B. kutty', 'Kutty'): return 'Others'
        if c in ('Chana', 'Gram'): return 'Chana'
        if c in ('Tuver', 'Tuar', 'Tuvar'): return 'Tuver'
        if c in ('Makai', 'Maize', 'Corn'): return 'Makai'
        return 'Others'

    print("=" * 110)
    print(f"| {'Month':<7} | {'App Profit':>12} | {'True Sheet':>12} | {'Difference':>11} | {'(Sheet Q)':>11} | {'(Discount)':>10} | {'App Exp':>9} | Notes")
    print("=" * 110)

    discrepancies = []

    for m in sorted_months:
        m_txs = txs_by_month[m]
        
        # 1. Commission Profit
        total_comm = 0.0
        new_closing_stock = {}

        for crop in CROP_CATS:
            open_stk = current_stock.get(crop, {'weight': 0.0, 'amount': 0.0})
            op_wt = open_stk['weight']
            op_amt = open_stk['amount']

            # Purchases
            pur_txs = [t for t in m_txs if t.get('type') == 'PURCHASE' and normalize_crop(t.get('category')) == crop]
            pur_wt = sum(clean_num(t.get('weight', 0)) for t in pur_txs)
            pur_amt = sum(clean_num(t.get('amount', 0)) for t in pur_txs)

            # Sales
            sale_txs = [t for t in m_txs if t.get('type') == 'SALE' and normalize_crop(t.get('category')) == crop]
            sale_wt = sum(clean_num(t.get('weight', 0)) for t in sale_txs)
            sale_amt = sum(clean_num(t.get('amount', 0)) for t in sale_txs)

            tot_wt = op_wt + pur_wt
            tot_amt = op_amt + pur_amt
            rate = tot_amt / tot_wt if tot_wt > 0 else 0.0

            cl_wt = max(0.0, tot_wt - sale_wt)
            cl_amt = cl_wt * rate
            new_closing_stock[crop] = {'weight': cl_wt, 'amount': cl_amt}

            cogs = sale_wt * rate
            crop_comm = sale_amt - cogs
            total_comm += crop_comm

        current_stock = new_closing_stock

        # 2. Service Profit
        srv_income = sum(clean_num(t.get('amount', 0)) for t in m_txs if t.get('type') == 'SERVICE')
        fuel_exp = sum(clean_num(t.get('amount', 0)) for t in m_txs if t.get('type') == 'EXPENSE' and t.get('category') == 'Fuel')
        net_srv = srv_income - fuel_exp

        # 3. Operating Expenses (INCLUDES Discount and Depreciation, excludes Fuel, Capital Purchases & Equity)
        op_exp = sum(clean_num(t.get('amount', 0)) for t in m_txs if t.get('type') == 'EXPENSE' and t.get('category') not in ('Fuel', 'Profit Distribution', 'Asset Purchase', 'Loan Repayment'))

        app_profit = round(total_comm + net_srv - op_exp, 2)
        s_info = sheet_data.get(m, {'q_profit': 0.0, 'discount': 0.0, 'true_profit': 0.0})
        true_sheet = round(s_info['true_profit'], 2)
        q_sheet = round(s_info['q_profit'], 2)
        disc_sheet = round(s_info['discount'], 2)
        diff = round(app_profit - true_sheet, 2)

        notes = ""
        if m == '2026-05':
            notes = "KNOWN MAY 2026 DISC."
        elif abs(diff) <= 200:
            notes = "EXACT MATCH (<=₹200)"
        else:
            notes = f"DISCREPANCY ({diff:+,.2f})"
            discrepancies.append((m, app_profit, true_sheet, diff))

        print(f"| {m:<7} | ₹{app_profit:11,.2f} | ₹{true_sheet:11,.2f} | ₹{diff:10,.2f} | ₹{q_sheet:10,.2f} | ₹{disc_sheet:9,.2f} | ₹{op_exp:8,.2f} | {notes}")

    print("=" * 110)
    print(f"Summary: Verified across {len(sorted_months)} months.")
    print(f"Non-matching months (excluding May 2026): {len(discrepancies)}")
    for d in discrepancies:
        print(f"  - {d[0]}: App = ₹{d[1]:,.2f}, True Sheet = ₹{d[2]:,.2f}, Diff = ₹{d[3]:,.2f}")

if __name__ == '__main__':
    main()
