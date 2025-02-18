const puppeteer = require('puppeteer');
const fs = require('fs');
const readlineSync = require('readline-sync');

// Load JSON data
const jsonData = JSON.parse(fs.readFileSync('students.json', 'utf8'));
const { class: className, students } = jsonData;

// Get user login credentials
const email = readlineSync.question('Enter your email: ');
const password = readlineSync.question('Enter your password: ', { hideEchoBack: true });

if (!className || students.length === 0) {
    console.error("❌ Error: No valid class or student data found.");
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

    // ✅ Step 5: Select Class (Forcing Interaction)
    try {
        await page.waitForSelector('div.multiselect', { visible: true, timeout: 60000 });

        // Click the Select Class dropdown to activate it
        await page.click('div.multiselect');

        // Wait for input field and type class name
        await page.waitForSelector('input.multiselect__input', { visible: true });
        await page.type('input.multiselect__input', className, { delay: 100 });

        console.log(`🔹 Entered Class: ${className}`);

        // Wait for dropdown and select correct match
        await page.waitForSelector('.multiselect__content li', { visible: true, timeout: 60000 });
        await page.evaluate((className) => {
            document.querySelectorAll('.multiselect__content li span.multiselect__option span').forEach((option) => {
                if (option.innerText.trim() === className) {
                    option.click();
                }
            });
        }, className);

        console.log(`✅ Selected Class: ${className}`);
    } catch (error) {
        console.error(`❌ Error: Unable to select class '${className}'. Check if the selector is correct.`);
        await browser.close();
        process.exit(1);
    }

    // ✅ Step 6: Loop through all students
    for (let student of students) {
        console.log(`🔹 Processing student: ${student}`);

        try {
            await page.waitForSelector('div.multiselect', { visible: true, timeout: 60000 });

            // Click the Select Student dropdown to activate it
            await page.click('div.multiselect');

            // Wait for input field and type student name
            await page.waitForSelector('input.multiselect__input', { visible: true });
            await page.type('input.multiselect__input', student, { delay: 100 });

            // Wait for dropdown and select correct match
            await page.waitForSelector('.multiselect__content li', { visible: true, timeout: 60000 });
            await page.evaluate((student) => {
                document.querySelectorAll('.multiselect__content li span.multiselect__option span').forEach((option) => {
                    if (option.innerText.trim() === student) {
                        option.click();
                    }
                });
            }, student);

            console.log(`✅ Selected student: ${student}`);
        } catch (error) {
            console.error(`❌ Error: Unable to select student '${student}'. Skipping.`);
            continue;
        }
    }

    console.log('🎉 All students processed successfully!');
})();
