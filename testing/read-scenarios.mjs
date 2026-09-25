import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Parse values from the AST. Never import or evaluate a scenario module.
export function readScenarios(path) {
  const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  if (source.parseDiagnostics.length) throw new Error('Invalid scenario syntax');
  let scenarios;
  let hasContract = false;
  function literal(node) {
    if (!node) throw new Error('Missing literal initializer');
    if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node)) return literal(node.expression);
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isNumericLiteral(node)) {
      const value = Number(node.text);
      if (!Number.isFinite(value)) throw new Error('Non-finite number');
      return value;
    }
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (node.kind === ts.SyntaxKind.NullKeyword) return null;
    if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(node.operand)) return -literal(node.operand);
    if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
    if (ts.isObjectLiteralExpression(node)) {
      const result = Object.create(null);
      for (const property of node.properties) {
        if (!ts.isPropertyAssignment(property) || !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))) {
          throw new Error('Only literal object properties are allowed');
        }
        const key = property.name.text;
        if (Object.hasOwn(result, key)) throw new Error(`Duplicate object key: ${key}`);
        result[key] = literal(property.initializer);
      }
      return result;
    }
    throw new Error(`Executable or computed scenario value is forbidden: ${ts.SyntaxKind[node.kind]}`);
  }
  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement)) {
      const clause = statement.importClause;
      const bindings = clause?.namedBindings;
      if (statement.moduleSpecifier.text !== '../../testing/scenario.ts' || !bindings || !ts.isNamedImports(bindings)
        || clause.name || bindings.elements.length !== 1 || !(clause.isTypeOnly || bindings.elements[0].isTypeOnly)
        || (bindings.elements[0].propertyName ?? bindings.elements[0].name).text !== 'Scenario') {
        throw new Error('Only the shared Scenario type import is allowed');
      }
      hasContract = true;
      continue;
    }
    if (!ts.isVariableStatement(statement) || !statement.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)
      || !(statement.declarationList.flags & ts.NodeFlags.Const) || statement.declarationList.declarations.length !== 1) {
      throw new Error('Scenario modules allow only type imports and an exported literal scenarios array');
    }
    const declaration = statement.declarationList.declarations[0];
    if (!ts.isIdentifier(declaration.name) || declaration.name.text !== 'scenarios' || scenarios !== undefined) throw new Error('Expected one scenarios export');
    scenarios = literal(declaration.initializer);
  }
  if (!hasContract || !Array.isArray(scenarios) || !scenarios.length) throw new Error('Expected shared type import and nonempty scenarios array');
  // JSON conversion gives regular objects for strict comparison with CLI JSON.
  const values = JSON.parse(JSON.stringify(scenarios));
  const names = new Set();
  const fingerprints = new Set();
  const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
  for (const s of values) {
    if (!s || typeof s.name !== 'string' || !s.name.trim() || names.has(s.name)
      || !Object.hasOwn(s, 'input') || !Object.hasOwn(s, 'expected')
      || (s.rawInput !== undefined && typeof s.rawInput !== 'string')
      || !Number.isInteger(s.exitCode ?? 0) || (s.exitCode ?? 0) < 0 || (s.exitCode ?? 0) > 255
      || Object.keys(s).some(k => !['name', 'input', 'expected', 'exitCode', 'rawInput'].includes(k))) throw new Error('Invalid scenario or duplicate name');
    names.add(s.name);
    let effectiveInput = ['json', s.input];
    if (s.rawInput !== undefined) {
      try { effectiveInput = ['json', JSON.parse(s.rawInput)]; } catch { effectiveInput = ['raw', s.rawInput]; }
    }
    const fingerprint = JSON.stringify(canonical([effectiveInput, s.expected, s.exitCode ?? 0]));
    if (fingerprints.has(fingerprint)) throw new Error(`Duplicate scenario behavior: ${s.name}`);
    fingerprints.add(fingerprint);
  }
  return values;
}
