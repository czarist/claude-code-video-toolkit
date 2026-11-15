import { chromium, Browser } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';

const URL = 'http://localhost:8080/';
const OUT = path.resolve(process.cwd(), '../projects/caderna-comercial/public/rec');
const BASE_HIDE = '.site-header,.wa-fab{visibility:hidden!important}';
const COPY = '.feature-card h3,.feature-card p{visibility:hidden!important}';
const hide = (sel: string) => `${sel}{visibility:hidden!important}`;

type Shot = { name: string; scheme?: 'light' | 'dark'; scrollTo: string; watch: string; mode?: 'class' | 'text'; hold: number; hide?: string; focus: string[] };
type Format = { suffix: string; viewport: { width: number; height: number }; dsf: number; video: { width: number; height: number }; shots: Shot[] };

const desktop: Shot[] = [
  { name: 'problemas', scheme: 'dark', scrollTo: '.problem-card', watch: '.problem-card', hold: 6, hide: hide('.problem-fix,.steps-band'), focus: ['.problem-card'] },
  { name: 'passos', scrollTo: '.steps-track', watch: '.steps-track', hold: 7, hide: hide('#como-funciona li p'), focus: ['.steps-track', '#como-funciona li h3'] },
  { name: 'recursos-l1', scrollTo: '.feature-apostila', watch: '.feature-edital', hold: 10, hide: COPY, focus: ['.feature-edital .feature-art', '.feature-apostila .feature-art', '.feature-aula-voz .feature-art'] },
  { name: 'recursos-l2', scrollTo: '.feature-simulado', watch: '.feature-quadro', hold: 10, hide: COPY, focus: ['.feature-quadro .feature-art', '.feature-simulado .feature-art', '.feature-discursiva .feature-art'] },
  { name: 'recursos-l3', scrollTo: '.feature-revisao', watch: '.feature-quiz', hold: 10, hide: COPY, focus: ['.feature-quiz .feature-art', '.feature-revisao .feature-art'] },
  { name: 'escolas', scrollTo: '#schools-title', watch: '.school-benefits li', hold: 6, hide: hide('#schools-title + p,.school-benefits li:nth-child(n+4)'), focus: ['#schools-title', '.school-benefits li:nth-child(-n+3)'] },
  { name: 'turma', scrollTo: '.class-preview', watch: '.class-preview [data-count]', mode: 'text', hold: 6, hide: '#para-escolas *{visibility:hidden!important}#para-escolas .class-preview,#para-escolas .class-preview *{visibility:visible!important}', focus: ['.class-preview'] },
  { name: 'cta', scheme: 'dark', scrollTo: '.cta-checklist', watch: '.cta-band [data-aos]', hold: 6, focus: ['#cta-title', '.cta-checklist'] },
  { name: 'contato', scheme: 'dark', scrollTo: '.contact-timeline', watch: '.contact-timeline', hold: 6, focus: ['.contact-timeline'] },
];
const card = (n: string): Shot => ({ name: n, scrollTo: `.feature-${n}`, watch: `.feature-${n}`, hold: 8, hide: COPY, focus: [`.feature-${n} .feature-art`] });
const mobile: Shot[] = [
  { ...desktop[0], hold: 5 },
  { ...desktop[1], scrollTo: '#como-funciona li', watch: '#como-funciona li', focus: ['#como-funciona li h3'] },
  card('edital'), card('apostila'), card('quiz'), card('simulado'),
  { ...desktop[7], focus: ['.cta-band'] },
];
const FORMATS: Format[] = [
  { suffix: '16x9', viewport: { width: 1920, height: 1080 }, dsf: 2, video: { width: 3840, height: 2160 }, shots: desktop },
  { suffix: '9x16', viewport: { width: 432, height: 768 }, dsf: 2.5, video: { width: 1080, height: 1920 }, shots: mobile },
];

async function record(browser: Browser, f: Format, s: Shot) {
  const tmp = path.join(OUT, '_frames', `${s.name}-${f.suffix}`);
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  const context = await browser.newContext({ viewport: f.viewport, deviceScaleFactor: f.dsf, reducedMotion: 'no-preference', colorScheme: s.scheme ?? 'light' });
  const page = await context.newPage();
  await page.addInitScript({ content: 'window.__name = (f) => f;' }); // tsx/esbuild keepNames helper
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: BASE_HIDE + (s.hide ?? '') });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  await page.evaluate(({ watch, mode }) => {
    const w = window as any; w.__animAt = null;
    const el = document.querySelector(watch);
    if (!el) throw new Error('sem elemento ' + watch);
    const mark = () => { if (w.__animAt == null) w.__animAt = performance.now(); };
    if (mode === 'text') new MutationObserver(mark).observe(el, { childList: true, characterData: true, subtree: true });
    else new MutationObserver(() => el.classList.contains('aos-animate') && mark()).observe(el, { attributes: true, attributeFilter: ['class'] });
  }, { watch: s.watch, mode: s.mode ?? 'class' });
  // CDP screencast: frames at device pixels (recordVideo would only fill a quarter of a 4K frame)
  const cdp = await context.newCDPSession(page);
  const frames: { t: number; file: string }[] = [];
  const writes: Promise<void>[] = [];
  cdp.on('Page.screencastFrame', (fr: any) => {
    const file = path.join(tmp, `f${String(frames.length).padStart(5, '0')}.jpg`);
    frames.push({ t: fr.metadata.timestamp, file });
    writes.push(fs.promises.writeFile(file, Buffer.from(fr.data, 'base64')));
    cdp.send('Page.screencastFrameAck', { sessionId: fr.sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 95, maxWidth: f.video.width, maxHeight: f.video.height, everyNthFrame: 1 });
  await page.waitForTimeout(400);
  await page.evaluate((sel) => {
    const r = document.querySelector(sel)!.getBoundingClientRect();
    window.scrollTo({ top: r.top + window.scrollY - (window.innerHeight - r.height) / 2, behavior: 'instant' as ScrollBehavior });
  }, s.scrollTo);
  await page.waitForTimeout(s.hold * 1000);
  const stopAt = Date.now() / 1000;
  await cdp.send('Page.stopScreencast');
  const info = await page.evaluate((focus) => ({
    origin: performance.timeOrigin, animAt: (window as any).__animAt as number | null,
    rects: Object.fromEntries(focus.map((q) => [q, [...document.querySelectorAll(q)].map((e) => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; })])),
  }), s.focus);
  await Promise.all(writes);
  await context.close();
  if (info.animAt == null) throw new Error(`${s.name}: a animação não disparou`);
  if (frames.length < 2) throw new Error(`${s.name}: sem quadros`);
  const t0 = frames[0].t;
  const fwd = (p: string) => p.split(path.sep).join('/');
  const lines = frames.map((fr, i) => `file '${fwd(fr.file)}'\nduration ${((i + 1 < frames.length ? frames[i + 1].t : stopAt) - fr.t).toFixed(4)}`);
  const list = lines.join('\n') + `\nfile '${fwd(frames[frames.length - 1].file)}'\n`;
  fs.writeFileSync(path.join(tmp, 'list.txt'), list);
  const k = f.video.width / f.viewport.width;
  const base = path.join(OUT, `${s.name}-${f.suffix}`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-vf', `fps=30,scale=${f.video.width}:${f.video.height}:flags=lanczos`, '-c:v', 'libx264', '-crf', '14', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-an', `${base}.mp4`]);
  const rects = Object.fromEntries(Object.entries(info.rects).map(([q, l]) => [q, (l as number[][]).map((r) => r.map((v) => Math.round(v * k)))]));
  const animateAt = +((info.origin + info.animAt) / 1000 - t0).toFixed(3);
  const dur = stopAt - t0;
  fs.writeFileSync(`${base}.json`, JSON.stringify({ name: s.name, scheme: s.scheme ?? 'light', video: f.video, animateAt, duration: +dur.toFixed(2), capturedFps: +(frames.length / dur).toFixed(1), rects }, null, 2));
  console.log(`${s.name}-${f.suffix}: A = ${animateAt}s, ${frames.length} quadros (${(frames.length / dur).toFixed(1)} fps capturados)`);
}

(async () => {
  const [onlyFormat, onlyShot] = process.argv.slice(2);
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch(process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {});
  for (const f of FORMATS.filter((x) => !onlyFormat || x.suffix === onlyFormat))
    for (const s of f.shots.filter((x) => !onlyShot || x.name === onlyShot)) await record(browser, f, s);
  await browser.close();
  fs.rmSync(path.join(OUT, '_frames'), { recursive: true, force: true });
})();
