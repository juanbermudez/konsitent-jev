import { lookup } from './helper.ts';
export async function execute(cache: Map<string, unknown>, tenant: string, id: string, load: Function) {
  return lookup(cache, tenant, id, load);
}
