import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
dotenv.config();

const delay = (seconds) => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, seconds * 1000);
    });
};

const scrollDown = async (page) => {
    return page.evaluate(_ => {
        window.scrollBy(0, window.innerHeight);
    });
};

(async () => {
    // Launch the browser and open a new blank page
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--start-maximized' // you can also use '--start-fullscreen'
        ]
    });
    const page = await browser.newPage();

    // full screen mode
    await page.setViewport({
        width: 1920,
        height: 1080
    });

    // Navigate the page to a URL
    await page.goto('https://www.linkedin.com/checkpoint/rm/sign-in-another-account?fromSignIn=true&trk=guest_homepage-basic_nav-header-signin');


    // Initate the login process
    await page.type('#username', process.env.USERNAME);
    await page.type('#password', process.env.PASSWORD);
    await page.click('[type="submit"]');

    // Wait for 5 seconds
    await delay(5);

    await page.goto('https://www.linkedin.com/mynetwork/');
    await delay(5);

    // Close messages tab
    const elements = await page.$$('.msg-overlay-bubble-header__controls.display-flex > *');
    await elements[2].click();

    // scroll down to load more connections
    for (let i = 0; i < 5; i++) {
        await scrollDown(page);
        await delay(1);
    }
    // back to top
    await page.evaluate(_ => {
        window.scrollTo(0, 0);
    });

    // Accept all incoming connection requests
    const acceptButtons = await page.$$('button[aria-label^="Accept"]');
    if (acceptButtons.length === 0) {
        console.log('No connection requests found');
    } else {
        console.log(`Accepting ${acceptButtons.length} connection requests`);
        for (const acceptButton of acceptButtons) {
            await acceptButton.click();
            await delay(1);
        }
    }

    // scroll down to load more connections
    await scrollDown(page);
    await delay(5);
    await scrollDown(page);
    await delay(5);
    // back to top
    await page.evaluate(_ => {
        window.scrollTo(0, 0);
    });

    // Send all that can be sent
    let request_sent = 0;
    let connection_buttons = await page.$$('button[aria-label^="Invite"]');
    console.log(`Sending ${connection_buttons.length} connection requests`);

    while (request_sent <= process.env.NO_OF_CONNECTION_TO_SEND && connection_buttons.length > 0) {
        const connect_button = connection_buttons[0];
        await connect_button.click();
        request_sent += 1;
        console.log('Request sent: ', request_sent);
        await delay(1);
        connection_buttons = await page.$$('button[aria-label^="Invite"]');
    }

    await browser.close();
})();