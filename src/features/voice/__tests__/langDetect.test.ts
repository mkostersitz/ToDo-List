import { detectLanguage } from '../langDetect';

describe('detectLanguage', () => {
  test('detects English by default', async () => {
    const r = await detectLanguage('done with my morning run');
    expect(r.language).toBe('en');
    expect(r.confidence).toBeGreaterThan(0.8);
  });

  test('detects German from keywords', async () => {
    const r = await detectLanguage('ich bin heute fertig mit dem Laufen und Meditation');
    expect(r.language).toBe('de');
  });

  test('detects Spanish from keywords', async () => {
    const r = await detectLanguage('hice mi entrenamiento hoy termine bien fue genial');
    expect(r.language).toBe('es');
  });

  test('returns confidence between 0 and 1', async () => {
    const r = await detectLanguage('hello world');
    expect(r.confidence).toBeGreaterThan(0);
    expect(r.confidence).toBeLessThanOrEqual(1);
  });
});
