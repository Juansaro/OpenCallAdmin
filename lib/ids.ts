export function nextId(prefix: string, existing: string[]): string {
  const nums = existing
    .map((id) => {
      const part = id.split("-").pop() ?? "0";
      return Number.parseInt(part, 10);
    })
    .filter((n) => Number.isFinite(n));
  const max = nums.length ? Math.max(...nums) : 1000;
  return `${prefix}-${max + 1}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
