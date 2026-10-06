import json
import re
from datetime import datetime
from collections import defaultdict

# 1. Baseline Opening Stock (end of 2024)
BASELINE_STOCK = {
    'Others': {'weight': 49885, 'amount': 477202.0},  # Grass
    'Chana': {'weight': 10100, 'amount': 85850.0},
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

    sheet_profit_by_month = {}
    sheet_comm_by_month = {}
    sheet_srv_by_month = {}
    sheet_exp_by_month = {}

    for s in sheets:
        title = s.get('title') or s.get('declaredName')
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
            row_str = ' '.join(str(c) for c in r)
            
            # Row Q: Profit (CM) (I + L - O)
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

        sheet_profit_by_month[mk] = q_profit
        sheet_comm_by_month[mk] = i_comm
        sheet_srv_by_month[mk] = l_srv
        sheet_exp_by_month[mk] = o_exp

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
        'Chana': {'weight': BASELINE_STOCK['Chana']['weight'], 'amount': BASELINE_STOCK['Chana']['amount']},
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

    print(f"{'Month':<7} | {'App Profit':>12} | {'Sheet Profit':>12} | {'Diff':>10} | {'App Comm':>11} | {'App Srv':>9} | {'App Exp':>9} | Notes")
    print("-" * 95)

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

        # 3. Operating Expenses
        op_exp = sum(clean_num(t.get('amount', 0)) for t in m_txs if t.get('type') == 'EXPENSE' and t.get('category') not in ('Fuel', 'Profit Distribution', 'Asset Purchase', 'Loan Repayment'))

        app_profit = round(total_comm + net_srv - op_exp, 2)
        sheet_profit = round(sheet_profit_by_month.get(m, 0.0), 2)
        diff = round(app_profit - sheet_profit, 2)

        notes = ""
        if abs(diff) > 1.0:
            notes = f"DISCREPANCY ({diff})"
            discrepancies.append((m, app_profit, sheet_profit, diff))
        else:
            notes = "EXACT MATCH"

        print(f"{m:<7} | ₹{app_profit:11,.2f} | ₹{sheet_profit:11,.2f} | ₹{diff:9,.2f} | ₹{total_comm:10,.2f} | ₹{net_srv:8,.2f} | ₹{op_exp:8,.2f} | {notes}")

    print("-" * 95)
    print(f"Total months checked: {len(sorted_months)}")
    print(f"Total discrepancies:  {len(discrepancies)}")
    for d in discrepancies:
        print(f"  - {d[0]}: App = ₹{d[1]:,.2f}, Sheet = ₹{d[2]:,.2f}, Diff = ₹{d[3]:,.2f}")

if __name__ == '__main__':
    main()
