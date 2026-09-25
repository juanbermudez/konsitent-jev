export async function evaluate(evidence, questionSet, options = {}) {
  if (!process.env.TYPESAFE_API_KEY) throw Error('TYPESAFE_API_KEY is required for semantic review');
  const request = { model: options.model || process.env.JEV_MODEL || 'jev-1.13.0', state: evidence, questions: questionSet };
  const began = performance.now();
  const response = await fetch('https://api.typesafe.ai/v1/systemone', {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.TYPESAFE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(request), signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw Error(`TypeSafe HTTP ${response.status}`);
  const result = await response.json();
  if (typeof result.model !== 'string') throw Error('Missing returned model');
  for (const [key, question] of Object.entries(questionSet)) {
    const a = result.answers?.[key];
    const options = Object.keys(question.criteria);
    if (a?.type !== 'choice' || !options.includes(a.choice) || !Number.isFinite(a.confidence) || a.confidence < 0 || a.confidence > 1
      || !a.probabilities || Object.keys(a.probabilities).length !== options.length
      || options.some(k => !Number.isFinite(a.probabilities[k]) || a.probabilities[k] < 0 || a.probabilities[k] > 1)
      || Math.abs(Object.values(a.probabilities).reduce((a,b) => a+b,0)-1) > 0.01) throw Error('Invalid Jev response');
  }
  return { request, result, durationMs: Math.round(performance.now() - began) };
}
