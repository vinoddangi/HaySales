import json
import re
from datetime import datetime

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
    with open('backups/allGoogleSheetsDump.json') as f:
        sheets = json.load(f)

    sheet_months = {}

    for s in sheets:
        title = s.get('title') or s.get('declaredName') or ''
        mk = month_key(title)
        if not mk: continue

        oc_tab = s.get('tabs', {}).get('Opening/Closing', {})
        rows = oc_tab.get('rows', [])

        vinod_cap = 0.0
        vinod_loan = 0.0
        profit = 0.0
        total_cap = 0.0
        
        daalu = 0.0
        fence = 0.0
        talpatri = 0.0
        lending = 0.0
        stock = 0.0
        cash = 0.0
        total_assets = 0.0

        for r in rows:
            for idx, c in enumerate(r):
                cs = str(c).strip().lower()
                # Partner Capital
                if cs == 'vinod' and idx + 1 < len(r):
                    val = clean_num(r[idx+1])
                    if val >= 1000000: vinod_cap = val
                elif 'vinod cap. intrest' in cs or 'vinod cap' in cs:
                    if idx + 1 < len(r):
                        val = clean_num(r[idx+1])
                        if 500000 <= val <= 1000000: vinod_loan = val
                elif cs == 'profit' and idx + 1 < len(r):
                    val = clean_num(r[idx+1])
                    if val > 1000000: profit = val
                elif cs == 'total' and idx + 1 < len(r):
                    val = clean_num(r[idx+1])
                    if val > 3000000: total_cap = val
                
                # Assets
                if 'cash balance' in cs and idx + 1 < len(r):
                    cash = clean_num(r[idx+1])
                elif 'lending to customer' in cs and idx + 1 < len(r):
                    val = clean_num(r[idx+1])
                    if val > 100000: lending = val
                elif 'closing stock' in cs:
                    # check next columns
                    for k in range(idx+1, min(idx+4, len(r))):
                        val = clean_num(r[k])
                        if val > 1000: stock = val; break
                elif 'fence' in cs and idx + 1 < len(r):
                    fence = clean_num(r[idx+1])
                elif 'talpatri' in cs and idx + 1 < len(r):
                    talpatri = clean_num(r[idx+1])
                elif ('daalu' in cs or 'tractor' in cs) and idx + 1 < len(r):
                    val = clean_num(r[idx+1])
                    if val > 100000: daalu = val

        sheet_months[mk] = {
            'vinod_cap': vinod_cap,
            'vinod_loan': vinod_loan,
            'profit': profit,
            'total_cap': total_cap,
            'daalu': daalu,
            'fence': fence,
            'talpatri': talpatri,
            'fixed_assets': daalu + fence + talpatri,
            'lending': lending,
            'stock': stock,
            'cash': cash,
        }

    print("=" * 135)
    print(f"| {'Month':<7} | {'Partner Capital':>15} | {'Partner Loan':>12} | {'Retained Profit':>15} | {'Total Liab+Cap':>15} | {'Cust Lending':>13} | {'Stock':>10} | {'Fixed Assets':>12} | {'Cash in Hand':>14} |")
    print("=" * 135)

    for mk in sorted(sheet_months.keys()):
        d = sheet_months[mk]
        print(f"| {mk:<7} | ₹{d['vinod_cap']:13,.0f} | ₹{d['vinod_loan']:10,.0f} | ₹{d['profit']:13,.2f} | ₹{d['total_cap']:13,.2f} | ₹{d['lending']:11,.0f} | ₹{d['stock']:8,.0f} | ₹{d['fixed_assets']:10,.0f} | ₹{d['cash']:12,.2f} |")
    print("=" * 135)

if __name__ == '__main__':
    main()
