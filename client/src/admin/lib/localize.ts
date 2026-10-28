/** Client mirror of the server's localize(): collapses { en, es } into a string. Used for previews. */
export function localizeDeep<T>(value: unknown, lang: 'en' | 'es'): T {
  const walk = (v: unknown): unknown => {
    if (v == null || typeof v !== 'object') return v;
    if (Array.isArray(v)) return v.map(walk);
    const obj = v as Record<string, unknown>;
    const keys = Object.keys(obj).filter((k) => k !== '_id');
    if (keys.length && keys.every((k) => k === 'en' || k === 'es') && keys.every((k) => typeof obj[k] === 'string' || obj[k] == null)) {
      return (obj[lang] as string) || (obj.en as string) || '';
    }
    return Object.fromEntries(Object.entries(obj).map(([k, val]) => [k, walk(val)]));
  };
  return walk(value) as T;
}
