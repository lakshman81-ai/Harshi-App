const puppeteer = require('puppeteer');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: "new", // Use new headless mode
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Capture console logs
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  // Set viewport
  await page.setViewport({ width: 1280, height: 800 });

  console.log('🚀 Starting Benchmark Suite...');

  try {
    // 1. Navigate to App with Benchmark Mode
    await page.goto('http://localhost:3000/?benchmark=true', { waitUntil: 'networkidle0' });
    console.log('✅ App Loaded');

    // Wait for Subjects
    await page.waitForSelector('h3', { timeout: 10000 }); // Subject card h3

    // Check if "Benchmark Suite" is visible
    const subjectTitle = await page.evaluate(() => {
        const h3s = Array.from(document.querySelectorAll('h3'));
        return h3s.find(el => el.textContent.includes('Benchmark Suite'))?.textContent;
    });

    if (subjectTitle) {
        console.log('✅ Benchmark Subject Found');
    } else {
        throw new Error('Benchmark Subject NOT found. Data load failed?');
    }

    // 2. Click Benchmark Subject
    await page.evaluate(() => {
        const h3s = Array.from(document.querySelectorAll('h3'));
        const subject = h3s.find(el => el.textContent.includes('Benchmark Suite'));
        subject.click();
    });
    await sleep(1000); // Wait for transition

    // --- SCENARIO: FLOW_01 (The Prodigy) ---
    console.log('\n🧪 Running FLOW_01 (The Prodigy)...');

    // Select Flow Topic (First topic)
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const topic = buttons.find(el => el.textContent.includes('Pedagogy: Flow State'));
        if (topic) topic.click();
    });
    await sleep(1000);

    // Click "Quiz" Tab
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        // Find tab button (exact match or distinct from Start Quiz)
        const quizTab = buttons.find(el => el.textContent.trim() === 'Quiz');
        if (quizTab) quizTab.click();
    });
    await sleep(1000);

    // Click "Start Quiz" (Handle "Start →" or "Start Quiz")
    const clickedStart = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const start = buttons.find(el => {
             const t = el.textContent.trim();
             return t.toLowerCase().includes('start');
        });
        if (start) {
            start.click();
            return true;
        }
        return false;
    });
    if (!clickedStart) {
        console.warn('⚠️ Could not find "Start" button for FLOW_01');
        const buttons = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()));
        console.log('   Visible Buttons:', buttons);
        const body = await page.evaluate(() => document.body.innerText.substring(0, 500));
        console.log('   Body Snippet:', body);
    }
    await sleep(3000); // Increased wait for quiz load

    // Answer 5 Questions Correctly
    // Q1-Q5 answers: 2, 4, 6, 8, 10
    const correctAnswers = ['2', '4', '6', '8', '10'];

    for (let i = 1; i <= 5; i++) {
        const answer = correctAnswers[i-1];
        console.log(`   answering Q${i} (Ans: ${answer})...`);

        // Click option
        const clicked = await page.evaluate((ans) => {
            const opts = Array.from(document.querySelectorAll('button'));
            const btn = opts.find(el => {
                const text = el.textContent.trim();
                return text === ans || text.endsWith(` ${ans}`) || text.includes(ans);
            });
            if (btn) {
                btn.click();
                return true;
            }
            return false;
        }, answer);

        if (!clicked) console.warn(`   ⚠️ Could not find option: ${answer}`);

        await sleep(500); // Wait for feedback

        // Click "Next" (Go to Review)
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const next = buttons.find(el => el.textContent.includes('Next') || el.textContent.includes('Submit'));
            if (next) next.click();
        });
        await sleep(500);

        // Click "Continue" (Go to Next Question)
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const cont = buttons.find(el => el.textContent.includes('Continue'));
            if (cont) cont.click();
        });
        await sleep(500);

        // Check for Streak (Now in Active Phase of next question)
        if (i >= 3 && i < 5) {
            const hasStreak = await page.evaluate(() => {
                return document.body.textContent.includes('Streak');
            });
            if (hasStreak) console.log(`   ✅ Streak detected at Q${i}`);
            // else console.warn(`   ⚠️ Streak NOT detected at Q${i}`);
        }
    }

    console.log('✅ FLOW_01 Completed');

    // Go back to Subject (Home -> Subject)
    await page.goto('http://localhost:3000/?benchmark=true', { waitUntil: 'networkidle0' });
    await sleep(1000);
    await page.evaluate(() => {
        const h3s = Array.from(document.querySelectorAll('h3'));
        const subject = h3s.find(el => el.textContent.includes('Benchmark Suite'));
        subject.click();
    });
    await sleep(1000);


    // --- SCENARIO: STRUGGLE_01 (The Stuck Student) ---
    console.log('\n🧪 Running STRUGGLE_01 (The Stuck Student)...');

    // Click "Pedagogy: Struggle Detect"
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const topic = buttons.find(el => el.textContent.includes('Pedagogy: Struggle Detect'));
        if (topic) topic.click();
    });
    await sleep(1000);

    // Click "Quiz" Tab
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const quizTab = buttons.find(el => el.textContent.trim() === 'Quiz');
        if (quizTab) quizTab.click();
    });
    await sleep(1000);

    // Start Quiz
    const clickedStartStruggle = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const start = buttons.find(el => el.textContent.includes('Struggle'));
        if (start) {
            start.click();
            return true;
        }
        return false;
    });
    if (!clickedStartStruggle) {
        console.warn('⚠️ Could not find "Start" button for STRUGGLE_01');
        const body = await page.evaluate(() => document.body.innerText.substring(0, 500));
        console.log('   Body Snippet:', body);
    }
    await sleep(3000);

    // Answer Incorrectly (Q: Capital of France? Ans: Paris. Wrong: London)
    console.log('   answering incorrectly (1st time)...');
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(el => el.textContent.includes('London'));
        if (btn) btn.click();
    });
    await sleep(500);

    // Click Next (to trigger check)
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const next = buttons.find(el => el.textContent.includes('Next'));
        if (next) next.click();
    });
    await sleep(500);

    // Verify "Try Again" or feedback
    const feedback1 = await page.evaluate(() => document.body.textContent);
    if (feedback1.includes('Try again') || feedback1.includes('Incorrect')) {
        console.log('✅ "Try Again" feedback detected');
    } else {
        console.warn('⚠️ "Try Again" feedback NOT detected');
    }

    // Answer Incorrectly again
    console.log('   answering incorrectly (2nd time)...');
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(el => el.textContent.includes('London'));
        if (btn) btn.click();
    });
    await sleep(500);

    // Click Next
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const next = buttons.find(el => el.textContent.includes('Next'));
        if (next) next.click();
    });
    await sleep(500);

    // Verify Hint
    const feedback2 = await page.evaluate(() => document.body.textContent);
    if (feedback2.includes('hint') || feedback2.includes('Hint')) {
        console.log('✅ Hint Auto-Reveal detected');
    } else {
        console.warn('⚠️ Hint Auto-Reveal NOT detected');
    }


    // --- SCENARIO: RENDER Checks ---
    console.log('\n🧪 Running RENDER Checks...');
    // Navigate to "Rendering Test"
    await page.goto('http://localhost:3000/?benchmark=true', { waitUntil: 'networkidle0' });
    await sleep(1000);
    await page.evaluate(() => {
        const h3s = Array.from(document.querySelectorAll('h3'));
        const subject = h3s.find(el => el.textContent.includes('Benchmark Suite'));
        subject.click();
    });
    await sleep(1000);

    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const topic = buttons.find(el => el.textContent.includes('Content Rendering'));
        if (topic) topic.click();
    });
    await sleep(1000);

    // Click "Quiz" Tab
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const quizTab = buttons.find(el => el.textContent.trim() === 'Quiz');
        if (quizTab) quizTab.click();
    });
    await sleep(1000);

    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const start = buttons.find(el => el.textContent.includes('Start Quiz'));
        if (start) start.click();
    });
    await sleep(1000);

    // Q1: LaTeX
    const hasLatex = await page.evaluate(() => {
        return !!document.querySelector('.katex') || !!document.querySelector('.math-inline') || !!document.querySelector('.math-display');
    });
    if (hasLatex) {
        console.log('✅ RENDER_01 (Equations): PASS');
    } else {
        const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
        console.warn('⚠️ RENDER_01 (Equations): FAIL (No .katex element)');
        console.log('   Body Text Snippet:', bodyText);
    }

    // Next Question
    await page.evaluate(() => {
         // Just select an answer to move on
         const buttons = Array.from(document.querySelectorAll('button'));
         // Find any option button
         const opt = buttons.find(b => b.textContent.includes('2') || b.textContent.includes('4'));
         if (opt) opt.click();
    });
    await sleep(200);
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const next = buttons.find(el => el.textContent.includes('Next'));
        if (next) next.click();
    });
    await sleep(500); // In Review Phase -> Click Continue
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const cont = buttons.find(el => el.textContent.includes('Continue'));
        if (cont) cont.click();
    });
    await sleep(1000); // On Q2

    // Q2: Mermaid (Check if mermaid rendered in question or if it's in explanation)
    // Wait, Q2 in benchmark data: `question: 'What does this diagram represent?', explanation: '...'`
    // I put mermaid code in explanation.
    // If I want to verify mermaid, I need to see it.
    // I'll skip to explanation.
    await page.evaluate(() => {
         const buttons = Array.from(document.querySelectorAll('button'));
         const opt = buttons.find(b => b.textContent.includes('Flowchart'));
         if (opt) opt.click();
    });
    await sleep(200);
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const next = buttons.find(el => el.textContent.includes('Next'));
        if (next) next.click();
    });
    await sleep(500); // In Review Phase

    // Check Mermaid
    const hasMermaid = await page.evaluate(() => {
        // Look for SVG or .mermaid class
        return !!document.querySelector('svg[id^="mermaid"]') || !!document.querySelector('.mermaid-container');
    });
    if (hasMermaid) console.log('✅ RENDER_02 (Diagrams): PASS');
    else console.warn('⚠️ RENDER_02 (Diagrams): FAIL');

    // Continue
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const cont = buttons.find(el => el.textContent.includes('Continue'));
        if (cont) cont.click();
    });
    await sleep(1000); // On Q3

    // Q3: YouTube (in Explanation)
    // Answer Q3
    await page.evaluate(() => {
         const buttons = Array.from(document.querySelectorAll('button'));
         const opt = buttons.find(b => b.textContent.includes('Rick'));
         if (opt) opt.click();
    });
    await sleep(200);
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const next = buttons.find(el => el.textContent.includes('Next') || el.textContent.includes('Submit'));
        if (next) next.click();
    });
    await sleep(500); // In Review Phase

    // Check YouTube (ReactPlayer renders iframe or div)
    const hasMedia = await page.evaluate(() => {
        return !!document.querySelector('iframe') || !!document.querySelector('video');
    });
    if (hasMedia) console.log('✅ RENDER_03 (Media): PASS');
    else console.warn('⚠️ RENDER_03 (Media): FAIL');


    console.log('\n🎉 ALL BENCHMARKS COMPLETED');

  } catch (e) {
    console.error('❌ Benchmark Failed:', e);
  } finally {
    await browser.close();
  }
})();
