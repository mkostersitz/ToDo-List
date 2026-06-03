type Row = Record<string, unknown>;

class MockDb {
  private tables: Record<string, Row[]> = {};

  executeSQL(sql: string, params: unknown[] = []): Row[] {
    const s = sql.trim();

    if (/CREATE TABLE/i.test(s) || /CREATE INDEX/i.test(s)) {
      const m = s.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
      if (m && !this.tables[m[1]]) this.tables[m[1]] = [];
      return [];
    }

    if (/^INSERT INTO/i.test(s)) {
      const tm = s.match(/INSERT INTO (\w+)/i);
      const cm = s.match(/\(([^)]+)\)\s+VALUES/i);
      if (tm && cm) {
        if (!this.tables[tm[1]]) this.tables[tm[1]] = [];
        const cols = cm[1].split(',').map((c: string) => c.trim());
        const row: Row = {};
        cols.forEach((col: string, i: number) => { row[col] = params[i] ?? null; });
        this.tables[tm[1]].push(row);
      }
      return [];
    }

    if (/^UPDATE/i.test(s)) {
      const tm = s.match(/UPDATE (\w+)/i);
      const wm = s.match(/WHERE (\w+)\s*=\s*\?/i);
      const sm2 = s.match(/SET (.+?) WHERE/i);
      if (tm && wm && sm2 && this.tables[tm[1]]) {
        const sets = sm2[1].split(',').map((x: string) => x.trim());
        const setCols = sets.map((x: string) => x.split('=')[0].trim());
        const whereVal = params[params.length - 1];
        this.tables[tm[1]] = this.tables[tm[1]].map(row => {
          if (row[wm[1]] === whereVal) {
            const updated = { ...row };
            setCols.forEach((col: string, i: number) => { updated[col] = params[i]; });
            return updated;
          }
          return row;
        });
      }
      return [];
    }

    if (/^SELECT/i.test(s)) {
      const tm = s.match(/FROM (\w+)/i);
      if (!tm) return [];
      let rows = [...(this.tables[tm[1]] ?? [])];
      const wm = s.match(/WHERE (.+?)(?:ORDER|LIMIT|$)/is);
      if (wm) {
        const eqs = [...wm[1].matchAll(/(\w+)\s*=\s*\?/gi)];
        rows = rows.filter(row => eqs.every((m, i) => row[m[1]] === params[i]));
        const nulls = [...wm[1].matchAll(/(\w+)\s+IS\s+NULL/gi)];
        rows = rows.filter(row => nulls.every(m => row[m[1]] == null));
      }
      return rows;
    }

    if (/^DELETE/i.test(s)) {
      const tm = s.match(/FROM (\w+)/i);
      const wm = s.match(/WHERE (\w+)\s*=\s*\?/i);
      if (tm && wm && this.tables[tm[1]]) {
        this.tables[tm[1]] = this.tables[tm[1]].filter(row => row[wm[1]] !== params[0]);
      }
      return [];
    }

    return [];
  }

  async prepareAsync(sql: string) {
    const db = this;
    return {
      executeAsync: (p: unknown[] = []) => {
        const rows = db.executeSQL(sql, p);
        return Promise.resolve({
          lastInsertRowId: 0,
          changes: 0,
          getAllAsync: () => Promise.resolve(rows),
          getFirstAsync: () => Promise.resolve(rows[0] ?? null),
          resetAsync: () => Promise.resolve(),
          [Symbol.asyncIterator]: function* () { yield* rows; },
        });
      },
      finalizeAsync: () => Promise.resolve(),
    };
  }

  async execAsync(sql: string): Promise<void> {
    sql.split(';').filter((s: string) => s.trim()).forEach((s: string) => this.executeSQL(s.trim(), []));
  }

  async closeAsync(): Promise<void> {}
  _reset(): void { this.tables = {}; }
  _getTable(name: string): Row[] { return this.tables[name] ?? []; }
}

export const mockDb = new MockDb();
export const mockExpoSQLite = {
  openDatabaseAsync: jest.fn().mockResolvedValue(mockDb),
};
