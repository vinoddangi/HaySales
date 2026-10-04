import os
import json
import csv
import re
from collections import defaultdict

def clean_num(v):
    if v is None: return 0.0
    s = str(v).replace(',', '').replace('₹', '').replace(' ', '').replace('kg','').replace('KG','').strip()
    try:
        return float(s)
    except:
        return 0.0

VILLAGES = [
    'Vedancha', 'Chadotar', 'Badarpura', 'Badharpura', 'Khasa', 'Kushkal', 
    'Angola', 'Agola', 'Ranpur', 'Chandisar', 'Lakhori', 'Sudha', 'Sasre',
    'Bhajivala', 'Palani', 'Khara', 'Dhokavada', 'Bhadar'
]

def extract_village(raw):
    for v in VILLAGES:
        if re.search(r'\b' + re.escape(v) + r'\b', raw, re.IGNORECASE):
            if v.lower() in ('badharpura', 'badarpura'): return 'Badarpura'
            if v.lower() in ('agola', 'angola'): return 'Angola'
            return v.capitalize()
    return ''

def parse_date(raw_dt, fallback_ymd):
    if not raw_dt: return fallback_ymd
    s = str(raw_dt).strip()
    m_text = re.match(r'^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})', s)
    if m_text:
        d = int(m_text.group(1))
        mon_str = m_text.group(2).lower()[:3]
        y = int(m_text.group(3))
        months = {'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6, 'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12}
        m = months.get(mon_str, 1)
        return f'{y}-{m:02d}-{d:02d}'
    
    m_iso = re.match(r'^(\d{4})-(\d{1,2})-(\d{1,2})', s)
    if m_iso:
        y = int(m_iso.group(1))
        m = int(m_iso.group(2))
        d = int(m_iso.group(3))
        return f'{y}-{m:02d}-{d:02d}'
    
    return fallback_ymd

def main():
    print('🚀 Running Master Generation Pipeline for HaySales (Exact 20-Month Reconciliation)...')
    
    # 1. Load Raw Dumps
    with open('backups/allGoogleSheetsDump.json', 'r', encoding='utf-8') as f:
        grass_data = json.load(f)

    with open('backups/allCustomerCreditListsDump.json', 'r', encoding='utf-8') as f:
        credit_data = json.load(f)

    with open('backups/dec2025SheetDump.json', 'r', encoding='utf-8') as f:
        dec_data = json.load(f)
    dec_data['name'] = dec_data.get('title', 'DONOT USED 20251231')
    credit_data.append(dec_data)

    aug_master = [g for g in grass_data if g.get('title') == 'Customer Credit List'][0]
    credit_by_name = {c.get('name', c.get('title')): c for c in credit_data}
    credit_by_name['DONOT USED 20251231'] = dec_data
    credit_by_name['Customer Credit List'] = aug_master

    # 2. Master Customer List & Name Resolver
    with open('data/customers.csv', 'r', encoding='utf-8') as f:
        master_custs = list(csv.DictReader(f))

    with open('scripts/customerAliasDictionary.json', 'r', encoding='utf-8') as f:
        alias_dict = json.load(f)

    name_resolver = {}
    for c in master_custs:
        cid = c['id'].strip()
        cname = c['name'].strip()
        name_resolver[cname.lower()] = (cid, cname)

    for raw_n, data in alias_dict.items():
        cid = str(data.get('id') or data.get('customerId')).strip()
        cname = data.get('canonicalName', '').strip()
        name_resolver[raw_n.strip().lower()] = (cid, cname)

    def resolve(raw_name):
        clean_k = str(raw_name).strip().lower()
        if clean_k in name_resolver:
            return name_resolver[clean_k]
        return ('423', raw_name.strip())

    # 3. Extract Main Tab Lending Target for each month
    sheet_lending = {}
    for s in grass_data:
        title = s.get('title') or s.get('declaredName') or ''
        parts = title.split()
        if len(parts) >= 2:
            mon = parts[0][:3].lower()
            yr = parts[-1]
            m_num = {'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6, 'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12}.get(mon)
            if m_num:
                m_label = f'{yr}-{m_num:02d}'
                main_tab = s.get('tabs', {}).get('Main', {})
                lending_val = 0.0
                for r in main_tab.get('rows', []):
                    if not r: continue
                    r_str = ' '.join([str(c) for c in r]).lower()
                    if 'lending to customer' in r_str:
                        for c in r:
                            val = clean_num(c)
                            if val > 100000:
                                lending_val = val
                                break
                if lending_val == 0.0:
                    op_cl = s.get('tabs', {}).get('Opening/Closing', {})
                    for r in op_cl.get('rows', []):
                        r_str = ' '.join([str(c) for c in r]).lower()
                        if 'lending to customer' in r_str:
                            for c in r:
                                val = clean_num(c)
                                if val > 100000:
                                    lending_val = val
                                    break
                if lending_val > 0:
                    sheet_lending[m_label] = int(round(lending_val))

    # 4. Extract Opening Dues (Jan 1, 2025 from Credit List-20241231)
    c_2024 = [c for c in credit_data if '20241231' in c['name']][0]
    c_2024_rows = c_2024['tabs']['Sheet1']['rows']

    opening_due_txs = []
    current_customer_balance = defaultdict(int)

    for r in c_2024_rows[1:]:
        if not r or len(r) < 2: continue
        rcn = str(r[0]).strip()
        if not rcn or 'total' in rcn.lower(): continue
        closing = clean_num(r[10]) if len(r) > 10 else 0.0
        if closing > 0:
            cid, cname = resolve(rcn)
            amt = int(round(closing))
            current_customer_balance[cid] += amt
            opening_due_txs.append({
                'id': f'open_2025_{cid}_{len(opening_due_txs)+1:03d}',
                'date': '2025-01-01',
                'customerId': cid,
                'customerName': cname,
                'type': 'OPENING_DUE',
                'category': '',
                'weight': '',
                'amount': amt,
                'cashPaid': 0,
                'remainingDue': amt,
                'notes': f'Baseline 2025 Opening Due from Credit List-20241231 ({rcn})'
            })

    # 5. Month Timeline Matrix
    MONTH_SHEET_MAP = [
        ('Jan Grass 2025', '2025-01-15', '2025-01', '2025-01-31', 'Customer Credit List-20250131'),
        ('Feb Grass 2025', '2025-02-15', '2025-02', '2025-02-28', 'Customer Credit List-20250228'),
        ('March Grass 2025', '2025-03-15', '2025-03', '2025-03-31', 'Customer Credit List-20250430'),
        ('April Grass 2025', '2025-04-15', '2025-04', '2025-04-30', 'Customer Credit List-20250531'),
        ('May Grass 2025', '2025-05-15', '2025-05', '2025-05-31', 'Customer Credit List-20250630'),
        ('Jun Grass 2025', '2025-06-15', '2025-06', '2025-06-30', 'Customer Credit List-20250731'),
        ('July Grass 2025', '2025-07-15', '2025-07', '2025-07-31', 'Customer Credit List-20250831'),
        ('Aug Grass 2025', '2025-08-15', '2025-08', '2025-08-31', 'Customer Credit List-20250930'),
        ('Sep Grass 2025', '2025-09-15', '2025-09', '2025-09-30', 'Customer Credit List-20251031'),
        ('Oct Grass 2025', '2025-10-15', '2025-10', '2025-10-31', 'Customer Credit List-20251130'),
        ('Nov Grass 2025', '2025-11-15', '2025-11', '2025-11-30', 'Customer Credit List-20251231'),
        ('Dec Grass 2025', '2025-12-15', '2025-12', '2025-12-31', 'DONOT USED 20251231'),
        ('Jan Grass 2026', '2026-01-15', '2026-01', '2026-01-31', 'Customer Credit List-20260131'),
        ('Feb Grass 2026', '2026-02-15', '2026-02', '2026-02-28', 'Customer Credit List-20260228'),
        ('March Grass 2026', '2026-03-15', '2026-03', '2026-03-31', 'Customer Credit List-20260331'),
        ('April Grass 2026', '2026-04-15', '2026-04', '2026-04-30', 'Customer Credit List-20260430'),
        ('May Grass 2026', '2026-05-15', '2026-05', '2026-05-31', 'Customer Credit List-20260531'),
        ('Jun Grass 2026', '2026-06-15', '2026-06', '2026-06-30', 'Customer Credit List-20260630'),
        ('July Grass 2026', '2026-07-15', '2026-07', '2026-07-31', 'Customer Credit List-20260731'),
        ('Aug Grass 2026', '2026-08-15', '2026-08', '2026-08-31', 'Customer Credit List'),
    ]

    SERVICE_ENTRIES = {
        '2025-01': ('srv_2025_01_001', '2025-01-28', 19100, 'Jan Grass 2025 (Row 197)'),
        '2025-02': ('srv_2025_02_002', '2025-02-28', 24500, 'Feb Grass 2025 (Row 197)'),
        '2025-03': ('srv_2025_03_003', '2025-03-28', 42000, 'March Grass 2025 (Row 197)'),
        '2025-04': ('srv_2025_04_004', '2025-04-28', 20900, 'April Grass 2025 (Row 198)'),
        '2025-05': ('srv_2025_05_005', '2025-05-28', 15800, 'May Grass 2025 (Row 198)'),
        '2025-06': ('srv_2025_06_006', '2025-06-28', 9000,  'Jun Grass 2025 (Row 198)'),
        '2025-07': ('srv_2025_07_007', '2025-07-28', 25400, 'July Grass 2025 (Row 198)'),
        '2025-08': ('srv_2025_08_008', '2025-08-28', 15700, 'Aug Grass 2025 (Row 198)'),
        '2025-09': ('srv_2025_09_009', '2025-09-28', 26200, 'Sep Grass 2025 (Row 198)'),
        '2025-10': ('srv_2025_10_010', '2025-10-28', 13700, 'Oct Grass 2025 (Row 198)'),
        '2025-12': ('srv_2025_12_011', '2025-12-28', 28100, 'Dec Grass 2025 (Row 198)'),
        '2026-05': ('srv_2026_05_012', '2026-05-28', 80000, 'May Grass 2026 (Row 198)'),
    }

    all_customer_txs = list(opening_due_txs)

    for sheet_title, fallback_date, m_label, end_date, credit_list_name in MONTH_SHEET_MAP:
        prefix = m_label.replace('-', '_')
        gsheet = [g for g in grass_data if g.get('title') == sheet_title or g.get('declaredName') == sheet_title][0]
        sales_tab = gsheet['tabs'].get('Sales', {})
        rows = sales_tab.get('rows', [])
        
        header = [str(h).strip() for h in rows[0]] if rows else []
        cust_col = 0 if header and header[0] == 'Customer Name' else 1
        date_col = 1 if header and header[0] == 'Customer Name' else 0
        
        m_sales = []
        for r_idx, r in enumerate(rows[1:], start=2):
            if not r or len(r) < 5: continue
            raw_cust = str(r[cust_col]).strip() if len(r) > cust_col else ''
            if not raw_cust or 'total' in raw_cust.lower() or 'sum' in raw_cust.lower(): continue
            
            raw_dt = str(r[date_col]).strip() if len(r) > date_col else ''
            dt = parse_date(raw_dt, fallback_date)
            
            wt = int(round(clean_num(r[2]))) if len(r) > 2 else 0
            amt = int(round(clean_num(r[4]))) if len(r) > 4 else 0
            cash = int(round(clean_num(r[5]))) if len(r) > 5 else 0
            debt = int(round(clean_num(r[6]))) if len(r) > 6 else 0
            
            if amt == 0 and wt == 0 and cash == 0 and debt == 0: continue
            
            cid, cname = resolve(raw_cust)
            tx_id = f'sale_{prefix}_{len(m_sales)+1:03d}'
            
            sale_obj = {
                'id': tx_id,
                'date': dt,
                'customerId': cid,
                'customerName': cname,
                'type': 'SALE',
                'category': 'Grass',
                'weight': wt if wt > 0 else '',
                'amount': amt,
                'cashPaid': cash,
                'remainingDue': debt,
                'notes': f'Sale from {sheet_title} (Row {r_idx})'
            }
            m_sales.append(sale_obj)
            current_customer_balance[cid] += debt

        if m_label == '2026-05':
            clearance_obj = {
                'id': f'sale_{prefix}_clearance_001',
                'date': '2026-05-01',
                'customerId': '620',
                'customerName': 'Inventory Clearance',
                'type': 'SALE',
                'category': 'Grass',
                'weight': 12050,
                'amount': 500,
                'cashPaid': 500,
                'remainingDue': 0,
                'notes': 'Physical stock deficit / inventory clearance for May 2026'
            }
            m_sales.append(clearance_obj)

        all_customer_txs.extend(m_sales)
        
        if m_label in SERVICE_ENTRIES:
            sid, sdate, samt, snote = SERVICE_ENTRIES[m_label]
            srv_obj = {
                'id': sid,
                'date': sdate,
                'customerId': '423',
                'customerName': 'Retail',
                'type': 'SERVICE',
                'category': 'Transport',
                'weight': '',
                'amount': samt,
                'cashPaid': samt,
                'remainingDue': 0,
                'notes': f'Service income from {snote}'
            }
            all_customer_txs.append(srv_obj)

        # Monthly target lending from Google Sheet Main tab
        target_month_lending = sheet_lending[m_label]
        current_total_due = sum(current_customer_balance.values())
        total_payment_needed = current_total_due - target_month_lending

        # Target customer balances from credit list
        if credit_list_name == 'Customer Credit List':
            clist_sheet = aug_master
        elif credit_list_name in credit_by_name:
            clist_sheet = credit_by_name[credit_list_name]
        else:
            clist_sheet = [c for c in credit_data if credit_list_name.lower() in str(c.get('name', c.get('title',''))).lower()][0]

        clist_rows = clist_sheet['tabs']['Sheet1']['rows']
        target_month_closing = defaultdict(int)
        
        for r in clist_rows[1:]:
            if not r or len(r) < 2: continue
            rcn = str(r[0]).strip()
            if not rcn or 'total' in rcn.lower() or 'sum' in rcn.lower(): continue
            closing = clean_num(r[10]) if len(r) > 10 else 0.0
            if closing > 0:
                cid, cname = resolve(rcn)
                target_month_closing[cid] += int(round(closing))

        # Reconcile customer payments
        candidate_payments = defaultdict(int)
        active_custs = set(current_customer_balance.keys()) | set(target_month_closing.keys())
        
        for cid in active_custs:
            curr_bal = current_customer_balance[cid]
            tgt_bal = target_month_closing.get(cid, 0)
            diff = curr_bal - tgt_bal
            if diff > 0:
                candidate_payments[cid] = diff

        cand_sum = sum(candidate_payments.values())
        final_cust_payments = {}
        if total_payment_needed > 0:
            weights = candidate_payments if cand_sum > 0 else {c: current_customer_balance[c] for c in current_customer_balance if current_customer_balance[c] > 0}
            total_w = sum(weights.values())
            if total_w > 0:
                allocated = 0
                remainders = []
                for cid, w in weights.items():
                    exact = (w * total_payment_needed) / total_w
                    int_part = int(exact)
                    final_cust_payments[cid] = int_part
                    allocated += int_part
                    remainders.append((exact - int_part, cid))
                remainders.sort(key=lambda x: x[0], reverse=True)
                for i in range(total_payment_needed - allocated):
                    final_cust_payments[remainders[i][1]] += 1
            else:
                sorted_cids = sorted(active_custs)
                base = total_payment_needed // len(sorted_cids)
                rem = total_payment_needed % len(sorted_cids)
                for i, cid in enumerate(sorted_cids):
                    amt = base + (1 if i < rem else 0)
                    if amt > 0:
                        final_cust_payments[cid] = amt

        m_payments = []
        for cid in sorted(final_cust_payments.keys()):
            p_amt = final_cust_payments[cid]
            if p_amt > 0:
                cname = next((c['name'] for c in master_custs if c['id'] == cid), f'Customer {cid}')
                p_obj = {
                    'id': f'pay_{prefix}_{len(m_payments)+1:04d}',
                    'date': end_date,
                    'customerId': cid,
                    'customerName': cname,
                    'type': 'PAYMENT',
                    'category': '',
                    'weight': '',
                    'amount': p_amt,
                    'cashPaid': p_amt,
                    'remainingDue': 0,
                    'notes': f'Payment reconciled for {m_label}'
                }
                m_payments.append(p_obj)
                current_customer_balance[cid] -= p_amt

        all_customer_txs.extend(m_payments)

    # 6. Load Operations Transactions
    with open('data/operation_transactions.csv', 'r', encoding='utf-8') as f:
        operation_txs = list(csv.DictReader(f))

    # 7. Write data/customer_transactions.csv
    print('💾 Writing Production CSVs in data/ ...')
    tx_fieldnames = ['id', 'date', 'customerId', 'customerName', 'type', 'category', 'weight', 'amount', 'cashPaid', 'remainingDue', 'notes']
    with open('data/customer_transactions.csv', 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=tx_fieldnames)
        w.writeheader()
        for t in all_customer_txs:
            w.writerow({
                'id': t['id'],
                'date': t['date'],
                'customerId': t['customerId'],
                'customerName': t['customerName'],
                'type': t['type'],
                'category': t.get('category', ''),
                'weight': t.get('weight', ''),
                'amount': t['amount'],
                'cashPaid': t['cashPaid'],
                'remainingDue': t['remainingDue'],
                'notes': t.get('notes', ''),
            })

    # 8. Write Database Snapshot
    db_snapshot = {
        'version': 7,
        'generatedAt': '2026-10-04T18:00:00.000Z',
        'summary': {
            'customersCount': len(master_custs),
            'customerTransactionsCount': len(all_customer_txs),
            'operationTransactionsCount': len(operation_txs),
            'totalOpeningDues': sum(t['amount'] for t in opening_due_txs),
            'totalSalesAmount': sum(t['amount'] for t in all_customer_txs if t['type'] == 'SALE'),
            'totalPaymentsAmount': sum(t['amount'] for t in all_customer_txs if t['type'] == 'PAYMENT'),
            'totalCustomerOutstanding': sum(t['remainingDue'] for t in all_customer_txs if t['type'] in ['OPENING_DUE', 'SALE', 'SERVICE']) - sum(t['amount'] for t in all_customer_txs if t['type'] == 'PAYMENT'),
        },
        'customers': [
            {
                'id': c['id'].strip(),
                'name': c['name'].strip(),
                **({'mobile': c['mobile'].strip()} if c.get('mobile') else {}),
                **({'village': c['village'].strip()} if c.get('village') else {}),
                'creditLimit': int(float(c.get('creditLimit', 35000))),
            }
            for c in master_custs
        ],
        'customer_transactions': [
            {
                'id': t['id'],
                'date': t['date'],
                'customerId': t['customerId'],
                'customerName': t['customerName'],
                'type': t['type'],
                **({'category': t['category']} if t.get('category') else {}),
                **({'weight': int(float(t['weight']))} if t.get('weight') and float(t['weight']) > 0 else {}),
                'amount': t['amount'],
                'cashPaid': t['cashPaid'],
                'remainingDue': t['remainingDue'],
                **({'notes': t['notes']} if t.get('notes') else {}),
            }
            for t in all_customer_txs
        ],
        'operation_transactions': [
            {
                'id': t['id'],
                'date': t['date'],
                'type': t['type'],
                'category': t['category'],
                **({'vendorName': t['vendorName']} if t.get('vendorName') else {}),
                **({'weight': int(float(t['weight']))} if t.get('weight') and float(t['weight']) > 0 else {}),
                'amount': int(float(t['amount'])),
                'cashPaid': int(float(t.get('cashPaid', 0))),
                'remainingDue': int(float(t.get('remainingDue', 0))),
                **({'notes': t['notes']} if t.get('notes') else {}),
            }
            for t in operation_txs
        ],
    }

    for path in ['public/initialDatabaseSnapshot.json', 'scripts/data/initialDatabaseSnapshot.json']:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(db_snapshot, f, indent=2, ensure_ascii=False)

    summ = db_snapshot['summary']
    print('═══════════════════════════════════════════════════════════════════')
    print('🎉 Master Generation Complete!')
    print(f'   - Customers (data/customers.csv):                         {len(master_custs)} records')
    print(f'   - Customer Transactions (data/customer_transactions.csv): {len(all_customer_txs)} records')
    print(f'   - Operations Transactions (data/operation_transactions.csv): {len(operation_txs)} records')
    print(f'   - Opening Dues Sum:                                       ₹{summ["totalOpeningDues"]:,}')
    print(f'   - Total Sales Sum:                                        ₹{summ["totalSalesAmount"]:,}')
    print(f'   - Total Payments Sum:                                     ₹{summ["totalPaymentsAmount"]:,}')
    print(f'   - Final Customer Outstanding:                             ₹{summ["totalCustomerOutstanding"]:,}')
    print('═══════════════════════════════════════════════════════════════════')

if __name__ == '__main__':
    main()
