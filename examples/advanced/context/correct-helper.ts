export async function lookup(cache: Map<string, unknown>, tenant: string, id: string, load: Function) {
  const key = JSON.stringify([tenant, id]);
  if (!cache.has(key)) cache.set(key, await load(tenant, id));
  return cache.get(key);
}
