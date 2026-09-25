export async function execute(client: any, newKey: () => string) {
  const key = newKey();
  for (let attempt = 0; attempt < 2; attempt++) {
    try { return await client.charge({ key, amount: 4200 }); }
    catch (error) { if (attempt === 1) throw error; }
  }
}
