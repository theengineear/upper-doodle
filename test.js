import puppeteer from 'puppeteer';

(async () => {
  try {
    // Open browser
    const browser = await puppeteer.launch({
      timeout: 10000,
      // Fix browser launch error when running in GitHub
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    // Start gathering JS coverage information
    await page.coverage.startJSCoverage();

    // Log browser messages to stdout
    page.on('console', message => console.log(message.text()));

    // Visit test page
    await page.goto('http://127.0.0.1:3000/test/?x-test-run-coverage');

    // Wait for test completion signal
    await page.evaluate(async () => {
      await new Promise(resolve => {
        const onMessage = evt => {
          const { type, data } = evt.data;
          if (
            type === 'x-test-root-coverage-request' ||
            type === 'x-test-root-end' ||
            (type === 'x-test-root-pong' && (data.waiting || data.ended))
          ) {
            top.removeEventListener('message', onMessage);
            resolve();
          }
        };
        top.addEventListener('message', onMessage);
        top.postMessage({ type: 'x-test-client-ping' }, '*');
      });
    });

    // Gather and send coverage information
    const js = await page.coverage.stopJSCoverage();

    await page.evaluate(async data => {
      await new Promise(resolve => {
        const onMessage = evt => {
          const { type } = evt.data;
          if (type === 'x-test-root-end') {
            top.removeEventListener('message', onMessage);
            resolve();
          }
        };
        top.addEventListener('message', onMessage);
        top.postMessage({ type: 'x-test-client-coverage-result', data }, '*');
      });
    }, { js });

    // Close browser
    await browser.close();
  } catch (error) {
    console.log('Bail out!');
    console.error(error);
    process.exit(1);
  }
})();
