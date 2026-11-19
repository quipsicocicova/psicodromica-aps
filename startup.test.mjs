import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.addInitScript(() => {
    window.startupTasks = [];
    new PerformanceObserver(list => list.getEntries().forEach(e => startupTasks.push(e.duration))).observe({ type: 'longtask', buffered: true });
  });
  await page.goto(process.env.TEST_URL || 'http://localhost:5176', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(150);
  const stats = await page.evaluate(() => ({ ready: Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd), maxTask: Math.round(Math.max(0, ...startupTasks)) }));
  console.log('Startup, CPU 4×:', stats);
  assert.ok(stats.ready < 3000, `Startup blocked for ${stats.ready}ms`);
  assert.ok(stats.maxTask < 1000, `Main thread blocked for ${stats.maxTask}ms`);
  console.log('PASS: responsive startup under 4× CPU throttling.');
} finally { await browser.close(); }
