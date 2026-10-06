import json
from collections import defaultdict

# 1. Google Sheets Data
sheet_bs = {
    '2025-01': {'cap': 1200000, 'loan': 800000, 'profit': 2265325.71, 'total_cap': 4265325.71, 'lending': 2527224, 'stock': 112122.56, 'fixed': 417800, 'cash': 1208179.15},
    '2025-02': {'cap': 1200000, 'loan': 750000, 'profit': 2430998.04, 'total_cap': 4380998.04, 'lending': 3066121, 'stock': 41867.64, 'fixed': 417800, 'cash': 855209.40},
    '2025-03': {'cap': 1200000, 'loan': 750000, 'profit': 2591977.25, 'total_cap': 4541977.25, 'lending': 2929144, 'stock': 122361.15, 'fixed': 423800, 'cash': 1066672.10},
    '2025-04': {'cap': 1200000, 'loan': 750000, 'profit': 2695308.66, 'total_cap': 4645308.66, 'lending': 2953520, 'stock': 563345.10, 'fixed': 394800, 'cash': 733643.56},
    '2025-05': {'cap': 1200000, 'loan': 750000, 'profit': 2752964.37, 'total_cap': 4702964.37, 'lending': 2997718, 'stock': 568081.95, 'fixed': 394800, 'cash': 742364.42},
    '2025-06': {'cap': 1200000, 'loan': 750000, 'profit': 2777935.78, 'total_cap': 4727935.78, 'lending': 2750785, 'stock': 343093.73, 'fixed': 364800, 'cash': 1269257.05},
    '2025-07': {'cap': 1200000, 'loan': 750000, 'profit': 2885335.00, 'total_cap': 4835335.00, 'lending': 3041114, 'stock': 82664.70, 'fixed': 334800, 'cash': 1376756.30},
    '2025-08': {'cap': 1200000, 'loan': 750000, 'profit': 2909807.77, 'total_cap': 4859807.77, 'lending': 3079674, 'stock': 49521.93, 'fixed': 304800, 'cash': 1425811.84},
    '2025-09': {'cap': 1200000, 'loan': 750000, 'profit': 2999018.66, 'total_cap': 4949018.66, 'lending': 2705563, 'stock': 197877.26, 'fixed': 284800, 'cash': 1760778.40},
    '2025-10': {'cap': 1200000, 'loan': 750000, 'profit': 3020678.92, 'total_cap': 4970678.92, 'lending': 2520432, 'stock': 19957.51, 'fixed': 264800, 'cash': 2165489.41},
    '2025-11': {'cap': 1500000, 'loan': 750000, 'profit': 3026945.88, 'total_cap': 5276945.88, 'lending': 2637319, 'stock': 153678.15, 'fixed': 1091500, 'cash': 1394448.73},
    '2025-12': {'cap': 1500000, 'loan': 750000, 'profit': 2085394.64, 'total_cap': 4335394.64, 'lending': 2735870, 'stock': 141033.88, 'fixed': 1084800, 'cash': 373690.76},
    '2026-01': {'cap': 1500000, 'loan': 750000, 'profit': 2184228.23, 'total_cap': 4434228.23, 'lending': 3134624, 'stock': 41537.27, 'fixed': 1084800, 'cash': 173266.96},
    '2026-02': {'cap': 1500000, 'loan': 750000, 'profit': 2299668.94, 'total_cap': 4549668.94, 'lending': 3112026, 'stock': 81269.34, 'fixed': 1084800, 'cash': 271573.60},
    '2026-03': {'cap': 1500000, 'loan': 750000, 'profit': 2413936.75, 'total_cap': 4663936.75, 'lending': 3174188, 'stock': 79627.57, 'fixed': 1084800, 'cash': 325321.18},
    '2026-04': {'cap': 1500000, 'loan': 750000, 'profit': 2476914.33, 'total_cap': 4726914.33, 'lending': 3174871, 'stock': 126268.07, 'fixed': 1084800, 'cash': 340975.26},
    '2026-05': {'cap': 1500000, 'loan': 750000, 'profit': 2657286.18, 'total_cap': 4907286.18, 'lending': 3221480, 'stock': 51811.50, 'fixed': 1084800, 'cash': 549194.68},
    '2026-06': {'cap': 1500000, 'loan': 750000, 'profit': 2709310.38, 'total_cap': 4959310.38, 'lending': 3099102, 'stock': 6757.99, 'fixed': 1084800, 'cash': 768650.39},
    '2026-07': {'cap': 1500000, 'loan': 750000, 'profit': 2815857.86, 'total_cap': 5065857.86, 'lending': 3511564, 'stock': 0.0, 'fixed': 1084800, 'cash': 469411.64},
    '2026-08': {'cap': 1500000, 'loan': 750000, 'profit': 2915943.72, 'total_cap': 5165943.72, 'lending': 3653295, 'stock': 58029.96, 'fixed': 1084800, 'cash': 369818.76},
}

def main():
    print("=" * 135)
    print(f"| {'Month':<7} | {'Total Liab & Capital':>20} | {'Customer Lending':>18} | {'Closing Stock':>15} | {'Fixed Assets':>14} | {'Cash in Hand (Exact)':>22} |")
    print("=" * 135)

    for ym in sorted(sheet_bs.keys()):
        d = sheet_bs[ym]
        print(f"| {ym:<7} | ₹{d['total_cap']:18,.2f} | ₹{d['lending']:16,d} | ₹{d['stock']:13,.2f} | ₹{d['fixed']:12,d} | ₹{d['cash']:20,.2f} |")

    print("=" * 135)

if __name__ == '__main__':
    main()
