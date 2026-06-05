#!/usr/bin/env node
/**
 * Validates user_self_diagnosis API config JSON: graph integrity, images, paths.
 * Usage: node scripts/validate-troubleshooting-flows.mjs path/to/config.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const flowsPath = process.argv[2];
if (!flowsPath) {
  console.error('Usage: node scripts/validate-troubleshooting-flows.mjs <path-to-api-config.json>');
  process.exit(1);
}
const resolvedFlowsPath = path.isAbsolute(flowsPath) ? flowsPath : path.join(process.cwd(), flowsPath);
const imageMapPath = path.join(root, 'src/config/troubleshooting-image-map.ts');
const assetsDir = path.join(root, 'src/assets/troubleshooting');

const config = JSON.parse(fs.readFileSync(resolvedFlowsPath, 'utf8'));
const mapSrc = fs.readFileSync(imageMapPath, 'utf8');
const mappedKeys = [...mapSrc.matchAll(/'([^']+)':\s*require/g)].map((m) => m[1]);

const errors = [];
const warnings = [];

function walkPaths(flow, nodeId, visited, pathSoFar) {
  const node = flow.nodes[nodeId];
  if (!node) {
    errors.push(`[${flow.id}] broken ref: ${pathSoFar.join(' → ')} → missing "${nodeId}"`);
    return;
  }
  if (visited.has(nodeId)) {
    errors.push(`[${flow.id}] cycle at ${nodeId}: ${pathSoFar.join(' → ')}`);
    return;
  }
  const nextVisited = new Set(visited);
  nextVisited.add(nodeId);

  if (node.type === 'question') {
    if (!node.options?.length) {
      errors.push(`[${flow.id}] ${nodeId}: question has no options`);
    }
    node.options?.forEach((opt) => {
      walkPaths(flow, opt.next, nextVisited, [...pathSoFar, `${nodeId}:${opt.label}`]);
    });
    return;
  }
  if (node.type === 'instruction') {
    warnings.push(`[${flow.id}] ${nodeId}: instruction node (Done button) — verify Figma uses Yes/No instead`);
    if (!node.next) errors.push(`[${flow.id}] ${nodeId}: instruction missing next`);
    else walkPaths(flow, node.next, nextVisited, [...pathSoFar, `${nodeId}:Done`]);
    return;
  }
  // terminal / result — end
}

for (const flow of config.flows) {
  const ids = new Set(Object.keys(flow.nodes));
  if (!ids.has(flow.startId)) {
    errors.push(`[${flow.id}] invalid startId: ${flow.startId}`);
  }

  for (const [id, node] of Object.entries(flow.nodes)) {
    if (node.next && !ids.has(node.next)) {
      errors.push(`[${flow.id}] ${id}.next → unknown ${node.next}`);
    }
    node.options?.forEach((o) => {
      if (!ids.has(o.next)) errors.push(`[${flow.id}] ${id} option "${o.label}" → unknown ${o.next}`);
    });

    node.images?.forEach((key) => {
      if (!mappedKeys.includes(key)) {
        errors.push(`[${flow.id}] ${id}: image key "${key}" not in image-map`);
      } else {
        const png = path.join(assetsDir, `${key}.png`);
        if (!fs.existsSync(png)) errors.push(`[${flow.id}] ${id}: missing file ${key}.png`);
      }
    });

    if (node.type === 'question' && node.options?.length === 2) {
      const hasRecheck = node.description?.toLowerCase().includes('internet working');
      const hasImages = (node.images?.length ?? 0) > 0;
      if (hasRecheck && !hasImages) {
        warnings.push(`[${flow.id}] ${id}: recheck question without images`);
      }
    }
  }

  walkPaths(flow, flow.startId, new Set(), [flow.startId]);
}

let pathCount = 0;
function countEndPaths(flow, nodeId, visited) {
  const node = flow.nodes[nodeId];
  if (!node || visited.has(nodeId)) return;
  const v = new Set(visited);
  v.add(nodeId);
  if (node.type === 'question') {
    node.options.forEach((o) => countEndPaths(flow, o.next, v));
    return;
  }
  pathCount += 1;
}

console.log('=== Troubleshooting flow audit ===\n');
for (const flow of config.flows) {
  pathCount = 0;
  countEndPaths(flow, flow.startId, new Set());
  console.log(`Flow: ${flow.title} (${flow.id})`);
  console.log(`  Nodes: ${Object.keys(flow.nodes).length}`);
  console.log(`  End-to-end paths: ${pathCount}`);
  for (const [id, node] of Object.entries(flow.nodes)) {
    const parts = [
      node.type,
      node.stepIndex != null ? `step ${node.stepIndex}/${node.totalSteps}` : '',
      node.images?.length ? `img:${node.images.join(',')}` : node.type === 'question' ? 'NO IMAGE' : '',
      node.options?.map((o) => o.label).join('|') || node.action || '',
    ].filter(Boolean);
    console.log(`    ${id}: ${parts.join(' · ')}`);
  }
  console.log('');
}

if (warnings.length) {
  console.log('WARNINGS:');
  warnings.forEach((w) => console.log('  ⚠', w));
  console.log('');
}
if (errors.length) {
  console.log('ERRORS:');
  errors.forEach((e) => console.log('  ✗', e));
  process.exit(1);
}
console.log('All graph and asset checks passed.');
