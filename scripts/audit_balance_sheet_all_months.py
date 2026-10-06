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

    month_data = {}

    for s in sheets:
        title = s.get('title') or s.get('declaredName') or ''
        mk = month_key(title)
        if not mk: continue

        oc_tab = s.get('tabs', {}).get('Opening/Closing', {})
        rows = oc_tab.get('rows', [])

        vinod_cap = 0.0
        vinod_loan = 0.0
        profit = 0.0
        total_liab_cap = 0.0
        
        pickup_tractor = 0.0
        fence = 0.0
        talpatri = 0.0
        lending = 0.0
        stock = 0.0
        cash = 0.0

        for r in rows:
            for i, c in enumerate(r):
                cs = str(c).strip().lower()
                
                # Capital & Liabilities
                if cs == 'vinod' and i + 1 < len(r):
                    val = clean_num(r[i+1])
                    if val >= 1000000: vinod_cap = val
                elif ('vinod cap. intrest' in cs or 'vinod cap' in cs) and i + 1 < len(r):
                    val = clean_num(r[i+1])
                    if 500000 <= val <= 1000000: vinod_loan = val
                elif cs == 'profit' and i + 1 < len(r):
                    val = clean_num(r[i+1])
                    if val > 1000000: profit = val
                elif cs == 'total' and i + 1 < len(r):
                    val = clean_num(r[i+1])
                    if val > 3000000: total_liab_cap = val
                
                # Assets
                if any(x in cs for x in ['daalu', 'tractor']) and i + 1 < len(r):
                    val = clean_num(r[i+1])
                    if val >= 100000: pickup_tractor = val
                elif 'fence' in cs and i + 1 < len(r):
                    fence = clean_num(r[i+1])
                elif 'talpatri' in cs and i + 1 < len(r):
                    talpatri = clean_num(r[i+1])
                elif 'lending to customer' in cs and i + 1 < len(r):
                    val = clean_num(r[i+1])
                    if val > 500000: lending = val
                elif 'closing stock' in cs:
                    for k in range(i+1, min(i+4, len(r))):
                        val = clean_num(r[k])
                        if val > 1000:
                            stock = val
                            break
                elif cs == 'cash balance' and i + 1 < len(r):
                    cash = clean_num(r[i+1])

        fixed_assets = pickup_tractor + fence + talpatri
        
        # If total_liab_cap wasn't directly found, calculate it
        if total_liab_cap == 0 and vinod_cap > 0:
            total_liab_cap = vinod_cap + vinod_loan + profit

        # Derived Cash in Hand = Total Liab & Cap - (Lending + Stock + Fixed Assets)
        derived_cash = total_liab_cap - (lending + stock + fixed_assets)

        month_data[mk] = {
            'vinod_cap': vinod_cap,
            'vinod_loan': vinod_loan,
            'profit': profit,
            'total_liab_cap': total_liab_cap,
            'pickup_tractor': pickup_tractor,
            'fence': fence,
            'talpatri': talpatri,
            'fixed_assets': fixed_assets,
            'lending': lending,
            'stock': stock,
            'sheet_cash': cash,
            'derived_cash': derived_cash,
        }

    print("=" * 145)
    print(f"| {'Month':<7} | {'Partner Cap':>12} | {'Partner Loan':>12} | {'Retained Profit':>15} | {'Total Liab+Cap':>15} | {'Fixed Assets':>12} | {'Cust Lending':>13} | {'Stock':>10} | {'Sheet Cash':>13} | {'Derived Cash':>13} |")
    print("=" * 145)

    for mk in sorted(month_data.keys()):
        d = month_data[mk]
        print(f"| {mk:<7} | ₹{d['vinod_cap']:10,.0f} | ₹{d['vinod_loan']:10,.0f} | ₹{d['profit']:13,.2f} | ₹{d['total_liab_cap']:13,.2f} | ₹{d['fixed_assets']:10,.0f} | ₹{d['lending']:11,.0f} | ₹{d['stock']:8,.0f} | ₹{d['sheet_cash']:11,.2f} | ₹{d['derived_cash']:11,.2f} |")

    print("=" * 145)

if __name__ == '__main__':
    main()
