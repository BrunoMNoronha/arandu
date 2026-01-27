import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
// @ts-ignore
global.window = dom.window;
global.document = dom.window.document;
// @ts-ignore
global.HTMLElement = dom.window.HTMLElement;
// @ts-ignore
global.Node = dom.window.Node;
// @ts-ignore
global.MutationObserver = dom.window.MutationObserver;

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback) => setTimeout(callback, 0) as any;
global.cancelAnimationFrame = (id) => clearTimeout(id);

// Import directly (tsx handles TS files)
import { BasicHudResource } from '../src/scenes/HudResources';

async function run() {
    console.log('Starting benchmark...');

    const valueEl = document.createElement('div');
    const fillEl = document.createElement('div');
    const extraEl = document.createElement('div');
    const resource = new BasicHudResource(valueEl, fillEl, [extraEl]);

    const iterations = 10000;
    const current = 50;
    const max = 100;
    const displayText = "50/100";

    // Setup mutation observer
    let mutationCount = 0;
    const observer = new MutationObserver((mutations) => {
        mutationCount += mutations.length;
    });

    observer.observe(valueEl, { attributes: true, childList: true, characterData: true, subtree: true });
    observer.observe(fillEl, { attributes: true, childList: true, characterData: true, subtree: true });
    observer.observe(extraEl, { attributes: true, childList: true, characterData: true, subtree: true });

    // Warmup
    resource.setValue(current, max, displayText);
    observer.takeRecords();
    mutationCount = 0;

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
        resource.setValue(current, max, displayText);
    }
    const end = performance.now();

    // Check for pending mutations
    const records = observer.takeRecords();
    mutationCount += records.length;

    console.log(`Iterations: ${iterations}`);
    console.log(`Time: ${(end - start).toFixed(2)}ms`);
    console.log(`Mutations: ${mutationCount}`);

    // Correctness verification
    console.log('Verifying correctness...');
    resource.setValue(51, 100, "51/100");
    const records2 = observer.takeRecords();
    if (records2.length > 0) {
        console.log('Correctness: Updates detected when values change.');
    } else {
        console.error('Correctness: NO updates detected when values change!');
        process.exit(1);
    }

    if (valueEl.textContent === "51/100" && fillEl.getAttribute('aria-valuenow') === "51") {
         console.log('Correctness: DOM values updated correctly.');
    } else {
         console.error('Correctness: DOM values incorrect!');
         console.log('Text:', valueEl.textContent);
         console.log('Aria:', fillEl.getAttribute('aria-valuenow'));
         process.exit(1);
    }

    observer.disconnect();
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
