// Autonomous build orchestrator — drives feature_list.json end-to-end
import { readFileSync, writeFileSync } from 'fs';

interface Feature {
  id: number;
  name: string;
  displayName: string;
  status: 'pending' | 'in-progress' | 'complete' | 'blocked';
  branch: string;
}

async function main() {
  const features: Feature[] = JSON.parse(readFileSync('./feature_list.json', 'utf-8'));
  const pending = features.filter(f => f.status === 'pending');
  console.log(`Starting autonomous build: ${pending.length} features remaining`);

  for (const feature of pending) {
    console.log(`\nBuilding: ${feature.displayName}`);
    // Update status to in-progress
    const idx = features.findIndex(f => f.id === feature.id);
    features[idx].status = 'in-progress';
    writeFileSync('./feature_list.json', JSON.stringify(features, null, 2));
    console.log(`  Branch: ${feature.branch}`);
    console.log(`  Run: claude "/feature ${feature.name}"`);
  }

  console.log('\nOrchestrator ready. Launch with: claude -p "/feature" --enable-auto-mode');
}

main().catch(console.error);
