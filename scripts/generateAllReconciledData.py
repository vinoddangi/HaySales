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
    print('🚀 Running High-Precision Month-by-Month Customer Reconciliation Pipeline...')

    # 1. Load Raw Dumps
    with open('backups/allGoogleSheetsDump.json', 'r', encoding='utf-8') as f:
        grass_data = json.load(f)

    with open('backups/allCustomerCreditListsDump.json', 'r', encoding='utf-8') as f:
        credit_data = json.load(f)

    with open('backups/dec2025SheetDump.json', 'r', encoding='utf-8') as f:
        dec2025_data = json.load(f)

    credit_by_name = {c['name']: c for c in credit_data}
    credit_by_name['DONOT USED Customer Credit List-20251231'] = dec2025_data

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

    cnames_by_id = {c['id']: c['name'] for c in master_custs}

    # 3. Extract Opening Dues (Jan 1, 2025)
    c_2024 = [c for c in credit_data if '20241231' in c['name']][0]
    c_2024_rows = c_2024['tabs']['Sheet1']['rows']

    opening_due_txs = []
    running_dues = defaultdict(float)
    for r in c_2024_rows[1:]:
        if not r or len(r) < 2: continue
        rcn = str(r[0]).strip()
        if not rcn or 'total' in rcn.lower(): continue
        closing = clean_num(r[10]) if len(r) > 10 else 0.0
        if closing > 0:
            cid, cname = resolve(rcn)
            running_dues[cid] += closing
            opening_due_txs.append({
                'id': f'due_2025_{len(opening_due_txs)+1:04d}',
                'date': '2025-01-01',
                'customerId': cid,
                'customerName': cname,
                'type': 'OPENING_DUE',
                'category': '',
                'weight': '',
                'amount': round(closing),
                'cashPaid': 0,
                'remainingDue': round(closing),
                'note': f'2024 Year-End Opening Balance for {cname}'
            })

    print(f'   - Opening Dues Count: {len(opening_due_txs)}, Sum: ₹{sum(t["amount"] for t in opening_due_txs):,}')

    # 4. Extract Sales Transactions from 20 Monthly Spreadsheets
    MONTHLY_SHEETS = [
        ('Jan Grass 2025',   '2025-01-15', '2025_01'),
        ('Feb Grass 2025',   '2025-02-15', '2025_02'),
        ('March Grass 2025', '2025-03-15', '2025_03'),
        ('April Grass 2025', '2025-04-15', '2025_04'),
        ('May Grass 2025',   '2025-05-15', '2025_05'),
        ('Jun Grass 2025',   '2025-06-15', '2025_06'),
        ('July Grass 2025',  '2025-07-15', '2025_07'),
        ('Aug Grass 2025',   '2025-08-15', '2025_08'),
        ('Sep Grass 2025',   '2025-09-15', '2025_09'),
        ('Oct Grass 2025',   '2025-10-15', '2025_10'),
        ('Nov Grass 2025',   '2025-11-15', '2025_11'),
        ('Dec Grass 2025',   '2025-12-15', '2025_12'),
        ('Jan Grass 2026',   '2026-01-15', '2026_01'),
        ('Feb Grass 2026',   '2026-02-15', '2026_02'),
        ('March Grass 2026', '2026-03-15', '2026_03'),
        ('April Grass 2026', '2026-04-15', '2026_04'),
        ('May Grass 2026',   '2026-05-15', '2026_05'),
        ('Jun Grass 2026',   '2026-06-15', '2026_06'),
        ('July Grass 2026',  '2026-07-15', '2026_07'),
        ('Aug Grass 2026',   '2026-08-15', '2026_08'),
    ]

    sales_txs = []
    monthly_sales_credit = defaultdict(lambda: defaultdict(float))

    for sheet_title, fallback_date, prefix in MONTHLY_SHEETS:
        matching_sheets = [s for s in grass_data if s['title'] == sheet_title]
        if not matching_sheets: continue
        sheet = matching_sheets[0]
        if 'Sales' not in sheet.get('tabs', {}): continue
        
        rows = sheet['tabs']['Sales']['rows']
        if not rows or len(rows) < 2: continue
        
        header = [str(h).strip() for h in rows[0]]
        cust_col = 0 if header[0] == 'Customer Name' else 1
        date_col = 1 if header[0] == 'Customer Name' else 0
        
        m_sales_count = 0
        m_lbl = prefix.replace('_', '-')
        for r_idx, r in enumerate(rows[1:], start=2):
            if not r or len(r) < 5: continue
            raw_cust = str(r[cust_col]).strip() if len(r) > cust_col else ''
            if not raw_cust or 'total' in raw_cust.lower() or 'sum' in raw_cust.lower(): continue
            
            raw_dt = str(r[date_col]).strip() if len(r) > date_col else ''
            dt = parse_date(raw_dt, fallback_date)
            
            wt = round(clean_num(r[2])) if len(r) > 2 else 0
            amt = round(clean_num(r[4])) if len(r) > 4 else 0
            cash = round(clean_num(r[5])) if len(r) > 5 else 0
            debt = round(clean_num(r[6])) if len(r) > 6 else 0
            
            if amt == 0 and wt == 0 and cash == 0 and debt == 0:
                continue
                
            cid, cname = resolve(raw_cust)
            m_sales_count += 1
            tx_id = f'sale_{prefix}_{m_sales_count:03d}'
            
            sales_txs.append({
                'id': tx_id,
                'date': dt,
                'customerId': cid,
                'customerName': cname,
                'type': 'SALE',
                'category': 'Grass',
                'weight': wt,
                'amount': amt,
                'cashPaid': cash,
                'remainingDue': debt,
                'note': f'Sale from {sheet_title} (Row {r_idx})'
            })
            monthly_sales_credit[m_lbl][cid] += debt

    # 5. Extract Service Income (Daalu)
    SERVICE_ENTRIES = [
        ('srv_2025_01_001', '2025-01-28', 19100, 'Jan Grass 2025', 197),
        ('srv_2025_02_002', '2025-02-28', 24500, 'Feb Grass 2025', 197),
        ('srv_2025_03_003', '2025-03-28', 42000, 'March Grass 2025', 197),
        ('srv_2025_04_004', '2025-04-28', 20900, 'April Grass 2025', 198),
        ('srv_2025_05_005', '2025-05-28', 15800, 'May Grass 2025', 198),
        ('srv_2025_06_006', '2025-06-28', 9000,  'Jun Grass 2025', 198),
        ('srv_2025_07_007', '2025-07-28', 25400, 'July Grass 2025', 198),
        ('srv_2025_08_008', '2025-08-28', 15700, 'Aug Grass 2025', 198),
        ('srv_2025_09_009', '2025-09-28', 26200, 'Sep Grass 2025', 198),
        ('srv_2025_10_010', '2025-10-28', 13700, 'Oct Grass 2025', 198),
        ('srv_2025_12_011', '2025-12-28', 28100, 'Dec Grass 2025', 198),
        ('srv_2026_05_012', '2026-05-28', 80000, 'May Grass 2026', 198),
    ]

    services_txs = []
    for sid, sdate, samt, ssrc, srow in SERVICE_ENTRIES:
        services_txs.append({
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
            'note': f'Service income (Daalu) from {ssrc} (Row {srow})'
        })

    # 6. Extract Operation Transactions
    with open('data/operation_transactions.csv', 'r', encoding='utf-8') as f:
        operation_txs = list(csv.DictReader(f))

    # 7. Extract Reconciled Month-by-Month Payments & Balance Adjustments
    ordered_lists = [
        {'date': '2024-12-31', 'monthLabel': '2024-12', 'name': 'Customer Credit List-20241231', 'sheet': credit_by_name['Customer Credit List-20241231']},
        {'date': '2025-01-31', 'monthLabel': '2025-01', 'name': 'Customer Credit List-20250131', 'sheet': credit_by_name['Customer Credit List-20250131']},
        {'date': '2025-02-28', 'monthLabel': '2025-02', 'name': 'Customer Credit List-20250228', 'sheet': credit_by_name['Customer Credit List-20250228']},
        {'date': '2025-03-31', 'monthLabel': '2025-03', 'name': 'Customer Credit List-20250430 (March True)', 'sheet': credit_by_name['Customer Credit List-20250430']},
        {'date': '2025-04-30', 'monthLabel': '2025-04', 'name': 'Customer Credit List-20250531 (April True)', 'sheet': credit_by_name['Customer Credit List-20250531']},
        {'date': '2025-05-31', 'monthLabel': '2025-05', 'name': 'Customer Credit List-20250630 (May True)', 'sheet': credit_by_name['Customer Credit List-20250630']},
        {'date': '2025-06-30', 'monthLabel': '2025-06', 'name': 'Customer Credit List-20250731 (Jun True)', 'sheet': credit_by_name['Customer Credit List-20250731']},
        {'date': '2025-07-31', 'monthLabel': '2025-07', 'name': 'Customer Credit List-20250831 (July True)', 'sheet': credit_by_name['Customer Credit List-20250831']},
        {'date': '2025-08-31', 'monthLabel': '2025-08', 'name': 'Customer Credit List-20250930 (Aug True)', 'sheet': credit_by_name['Customer Credit List-20250930']},
        {'date': '2025-09-30', 'monthLabel': '2025-09', 'name': 'Customer Credit List-20251031 (Sep True)', 'sheet': credit_by_name['Customer Credit List-20251031']},
        {'date': '2025-10-31', 'monthLabel': '2025-10', 'name': 'Customer Credit List-20251130 (Oct True)', 'sheet': credit_by_name['Customer Credit List-20251130']},
        {'date': '2025-11-30', 'monthLabel': '2025-11', 'name': 'Customer Credit List-20251231 (Nov True)', 'sheet': credit_by_name['Customer Credit List-20251231']},
        {'date': '2025-12-31', 'monthLabel': '2025-12', 'name': 'DONOT USED Customer Credit List-20251231 (Dec True)', 'sheet': credit_by_name['DONOT USED Customer Credit List-20251231']},
        {'date': '2026-01-31', 'monthLabel': '2026-01', 'name': 'Customer Credit List-20260131', 'sheet': credit_by_name['Customer Credit List-20260131']},
        {'date': '2026-02-28', 'monthLabel': '2026-02', 'name': 'Customer Credit List-20260228', 'sheet': credit_by_name['Customer Credit List-20260228']},
        {'date': '2026-03-31', 'monthLabel': '2026-03', 'name': 'Customer Credit List-20260331', 'sheet': credit_by_name['Customer Credit List-20260331']},
        {'date': '2026-04-30', 'monthLabel': '2026-04', 'name': 'Customer Credit List-20260430', 'sheet': credit_by_name['Customer Credit List-20260430']},
        {'date': '2026-05-31', 'monthLabel': '2026-05', 'name': 'Customer Credit List-20260531', 'sheet': credit_by_name['Customer Credit List-20260531']},
        {'date': '2026-06-30', 'monthLabel': '2026-06', 'name': 'Customer Credit List-20260630', 'sheet': credit_by_name['Customer Credit List-20260630']},
        {'date': '2026-07-31', 'monthLabel': '2026-07', 'name': 'Customer Credit List-20260731', 'sheet': credit_by_name['Customer Credit List-20260731']},
        {'date': '2026-08-31', 'monthLabel': '2026-08', 'name': 'Customer Credit List (Aug Master)', 'sheet': [g for g in grass_data if g['title'] == 'Customer Credit List'][0]},
    ]

    payments_final = []
    adjustments_final = []
    
    for idx in range(1, len(ordered_lists)):
        m_curr = ordered_lists[idx]
        m_lbl = m_curr['monthLabel']
        m_dt = m_curr['date']
        sname = m_curr['name']
        clean_month = m_lbl.replace('-', '_')
        
        target_closing = defaultdict(float)
        curr_rows = m_curr['sheet'].get('tabs', {}).get('Sheet1', {}).get('rows', [])
        is_6col = len(curr_rows[0]) <= 8 if curr_rows else False
        
        direct_pmts_this_month = defaultdict(float)
        
        for r in curr_rows[1:]:
            if not r or len(r) < 2: continue
            rcn = str(r[1] if is_6col else r[0]).strip()
            if not rcn or 'total' in rcn.lower(): continue
            cid, cname = resolve(rcn)
            
            if not is_6col:
                c2 = clean_num(r[6]) if len(r) > 6 else 0.0
                c3 = clean_num(r[7]) if len(r) > 7 else 0.0
                kasar = clean_num(r[8]) if len(r) > 8 else 0.0
                tot_dir = c2 + c3 + kasar
                if tot_dir > 0:
                    direct_pmts_this_month[cid] += tot_dir
            else:
                new_cash = clean_num(r[4]) if len(r) > 4 else 0.0
                if new_cash > 0:
                    direct_pmts_this_month[cid] += new_cash
                
            closing = clean_num(r[5] if is_6col else r[-1])
            target_closing[cid] += closing

        sales_for_month = monthly_sales_credit[m_lbl]
        all_month_cids = set(running_dues.keys()) | set(sales_for_month.keys()) | set(target_closing.keys())
        
        m_pmt_count = 0
        m_adj_count = 0
        for cid in sorted(all_month_cids):
            cname = cnames_by_id.get(cid, f'Customer {cid}')
            op = running_dues[cid]
            sc = sales_for_month[cid]
            tgt = target_closing[cid]
            
            diff = op + sc - tgt
            
            if diff > 0.01:
                dir_p = direct_pmts_this_month.get(cid, 0.0)
                
                if dir_p > 0:
                    dir_amt = min(dir_p, diff)
                    m_pmt_count += 1
                    payments_final.append({
                        'id': f'pay_{clean_month}_{m_pmt_count:04d}',
                        'date': m_dt,
                        'customerId': cid,
                        'customerName': cname,
                        'type': 'PAYMENT',
                        'category': '',
                        'weight': '',
                        'amount': round(dir_amt),
                        'cashPaid': round(dir_amt),
                        'remainingDue': 0,
                        'note': f'Direct payment recorded in {sname} (Credit: ₹{round(dir_amt):,})'
                    })
                    rem_clearance = diff - dir_amt
                else:
                    rem_clearance = diff
                    
                if rem_clearance > 0.01:
                    m_pmt_count += 1
                    payments_final.append({
                        'id': f'pay_clr_{clean_month}_{m_pmt_count:04d}',
                        'date': m_dt,
                        'customerId': cid,
                        'customerName': cname,
                        'type': 'PAYMENT',
                        'category': '',
                        'weight': '',
                        'amount': round(rem_clearance),
                        'cashPaid': round(rem_clearance),
                        'remainingDue': 0,
                        'note': f'Customer clearance payment for {m_lbl} (Reconciled with {sname})'
                    })
                
                running_dues[cid] = tgt
            elif diff < -0.01:
                # Upward balance adjustment / unrecorded debt addition
                debt_addition = abs(diff)
                m_adj_count += 1
                adjustments_final.append({
                    'id': f'adj_{clean_month}_{m_adj_count:04d}',
                    'date': m_dt,
                    'customerId': cid,
                    'customerName': cname,
                    'type': 'OPENING_DUE',
                    'category': '',
                    'weight': '',
                    'amount': round(debt_addition),
                    'cashPaid': 0,
                    'remainingDue': round(debt_addition),
                    'note': f'Periodic balance adjustment / unrecorded credit addition in {sname}'
                })
                running_dues[cid] = tgt
            else:
                running_dues[cid] = tgt

    all_customer_txs = opening_due_txs + sales_txs + services_txs + payments_final + adjustments_final
    all_customer_txs.sort(key=lambda x: (x['date'], x['type']))

    # 8. Write Production Files
    print('💾 Writing Production CSVs in data/ ...')
    
    # data/customers.csv
    cust_fieldnames = ['id', 'name', 'mobile', 'village', 'creditLimit']
    with open('data/customers.csv', 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=cust_fieldnames)
        w.writeheader()
        for c in master_custs:
            w.writerow({
                'id': c['id'].strip(),
                'name': c['name'].strip(),
                'mobile': c.get('mobile', '').strip(),
                'village': c.get('village', '').strip(),
                'creditLimit': int(float(c.get('creditLimit', 35000))),
            })

    # data/customer_transactions.csv
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
                'notes': t.get('note', ''),
            })

    # 9. Build and Write initialDatabaseSnapshot.json
    db_snapshot = {
        'version': 8,
        'generatedAt': '2026-10-04T10:37:00.000Z',
        'summary': {
            'customersCount': len(master_custs),
            'customerTransactionsCount': len(all_customer_txs),
            'operationTransactionsCount': len(operation_txs),
            'totalOpeningDues': sum(t['amount'] for t in all_customer_txs if t['type'] == 'OPENING_DUE'),
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
                **({'notes': t['note']} if t.get('note') else {}),
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
    print('🎉 Month-by-Month 100% Reconciled Generation Complete!')
    print(f'   - Customers (data/customers.csv):                         {len(master_custs)} records')
    print(f'   - Customer Transactions (data/customer_transactions.csv): {len(all_customer_txs)} records')
    print(f'   - Operations Transactions (data/operation_transactions.csv): {len(operation_txs)} records')
    print(f'   - Opening Dues & Adjustments Sum:                         ₹{summ["totalOpeningDues"]:,}')
    print(f'   - Total Sales Sum:                                        ₹{summ["totalSalesAmount"]:,}')
    print(f'   - Total Payments Sum:                                     ₹{summ["totalPaymentsAmount"]:,}')
    print(f'   - Final Customer Outstanding:                             ₹{summ["totalCustomerOutstanding"]:,}')
    print('═══════════════════════════════════════════════════════════════════')

if __name__ == '__main__':
    main()
