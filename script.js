const puppeteer = require('puppeteer');
const fs = require('fs');
const readlineSync = require('readline-sync');

// Load JSON data
const jsonData = JSON.parse(fs.readFileSync('students.json', 'utf8'));
const { class: className } = jsonData;

// Get user login credentials
const email = readlineSync.question('Enter your email: ');
const password = readlineSync.question('Enter your password: ', { hideEchoBack: true });

if (!className) {
    console.error("❌ Error: No valid class found.");
    process.exit(1);
}

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // ✅ Step 1: Log in
    await page.goto('https://admin.studentqr.com/login', { waitUntil: 'domcontentloaded' });
    await page.type('input[name="email"]', email);
    await page.type('input[name="password"]', password);

    await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'domcontentloaded' })
    ]);

    console.log('✅ Logged in successfully!');

    // ✅ Step 2: Navigate to Student Transfer Page
    await page.goto('https://admin.studentqr.com/class/show/62bc7d30ea389f702dfe1f9f', { waitUntil: 'domcontentloaded' });

    console.log('✅ Navigated to Class Details Page!');

    // ✅ Step 3: Click "Add & Transfer Student(s)" Button
    await page.waitForSelector('#addStudentBtn', { visible: true });
    await page.click('#addStudentBtn');

    console.log('✅ Clicked "Add & Transfer Student(s)" button!');

    // ✅ Step 4: Click "Transfer Students" Tab
    await page.waitForSelector('a, button', { visible: true });
    await page.evaluate(() => {
        document.querySelectorAll('a, button').forEach(tab => {
            if (tab.innerText.includes("Transfer Students")) {
                tab.click();
            }
        });
    });

    console.log('✅ Clicked "Transfer Students" tab!');

    // ✅ Step 5: Select Class Inside the Modal
    try {
        // Wait for modal to appear
        await page.waitForSelector('#transfer-student > div > div:nth-child(2) > div.multiselect__tags > span.multiselect__placeholder', { visible: true, timeout: 6000 });

        const classInputSelector = '#transfer-student > div > div:nth-child(2) > div.multiselect__tags > span.multiselect__placeholder';

        // Click the "Select Class" input inside the modal
        await page.click(classInputSelector);
        console.log('✅ Clicked "Select Class"!');

        // Wait for input field and type class name
        await page.waitForSelector(classInputSelector, { visible: true });
        await page.type(classInputSelector, className, { delay: 10 });

        console.log(`🔹 Entered Class: ${className}`);

        // Wait for dropdown and select correct class
        const dropdownSelector = '#null-0 > span > span';
        await page.waitForSelector(dropdownSelector, { visible: true, timeout: 6000 });

        await page.evaluate((className) => {
            document.querySelectorAll('#null-0 > span > span').forEach((option) => {
                if (option.innerText.trim() === className) {
                    option.click();
                }
            });
        }, className);

        console.log(`✅ Selected Class: ${className}`);
    } catch (error) {
        console.error(`❌ Error: Unable to select class '${className}'.`);
        await browser.close();
        process.exit(1);
    }

    console.log('🎉 Successfully selected class!');
})();
