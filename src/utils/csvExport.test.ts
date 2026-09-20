import { describe, expect, it } from 'vitest';
import { convertToCsv, escapeCsvCell, parseCsv } from './csvExport';

describe('csvExport utilities', () => {
  it('escapes special characters and quotes correctly', () => {
    expect(escapeCsvCell('Simple text')).toBe('Simple text');
    expect(escapeCsvCell('Text with, comma')).toBe('"Text with, comma"');
    expect(escapeCsvCell('Text with "quotes"')).toBe('"Text with ""quotes"""');
    expect(escapeCsvCell(1234.56)).toBe('1234.56');
    expect(escapeCsvCell(null)).toBe('');
    expect(escapeCsvCell(undefined)).toBe('');
  });

  it('converts objects array to formatted CSV string', () => {
    const data = [
      { id: '1', name: 'Ramesh Patel', amount: 1200 },
      { id: '2', name: 'Haresh, Bera', amount: 3500 },
    ];

    const columns = [
      { header: 'ID', accessor: (d: (typeof data)[0]) => d.id },
      { header: 'Customer Name', accessor: (d: (typeof data)[0]) => d.name },
      { header: 'Amount (₹)', accessor: (d: (typeof data)[0]) => d.amount },
    ];

    const csv = convertToCsv(data, columns);
    expect(csv).toContain('ID,Customer Name,Amount (₹)');
    expect(csv).toContain('1,Ramesh Patel,1200');
    expect(csv).toContain('2,"Haresh, Bera",3500');
  });

  it('parses standard and escaped CSV text accurately', () => {
    const csvContent = `ID,Customer Name,Amount\r\n1,Ramesh Patel,1200\r\n2,"Haresh, Bera",3500`;
    const parsed = parseCsv(csvContent);

    expect(parsed.length).toBe(3);
    expect(parsed[0]).toEqual(['ID', 'Customer Name', 'Amount']);
    expect(parsed[1]).toEqual(['1', 'Ramesh Patel', '1200']);
    expect(parsed[2]).toEqual(['2', 'Haresh, Bera', '3500']);
  });
});
