import puppeteer, { Browser, ElementHandle, PageEmittedEvents } from "puppeteer";
import fs, { write } from "fs";
import {
    Readability
} from '@mozilla/readability';
import {
    JSDOM,
    VirtualConsole
} from 'jsdom';
import { GlobalState, PrismaClient } from "@prisma/client";
import { title } from "process";


interface Content {
    excerpt: string | null,
}
interface News {
    title: string | null,
    thumbnail: string | null,
    publisherLogo: string | null,
    publisherName: string | null,
    publishedTime: string | null,
    url: string | null,
    content: Content
}

interface Headline {
    storiesURL: string | null,
    completeNews: News[],
}

const virtualConsole = new VirtualConsole();
// don't print error message
virtualConsole.sendTo(console, { omitJSDOMErrors: true });
virtualConsole.on("jsdomError", () => {;});
virtualConsole.on("error", () => {;});

async function storyURLtoStoryID(url: string) {
    const urlWithoutParams = url.split("?")[0]
    const storyID = urlWithoutParams.split("/").pop()
    return storyID;
}

async function crawlGoogleNews(browser: Browser, limit: number = 10,
    )  {
    const headlinesList: Headline[] = [];
    try {
        console.log(`Crawling ${limit} Google News Headlines...`);
        const page = await browser.newPage();
        const newPage = await browser.newPage();
        await newPage.setRequestInterception(true);
        newPage.on("request", async (request) => {
            // await request.abort();
        })
        await page.bringToFront();
        await page.goto("https://news.google.com/home?hl=id&gl=ID&ceid=ID:id");
        const artikelpopulerXPath = `//a[contains(., "Artikel populer")]`;
        // wait for text "Artikel populer" with a tag
        await page.waitForXPath(artikelpopulerXPath);

        // click it
        const [artikelpopuler] = await page.$x(artikelpopulerXPath) as ElementHandle<HTMLAnchorElement>[];
        artikelpopuler.click();

        // get all article tag
        const topicsXPath = `/html/body/c-wiz[2]/div/main/c-wiz/c-wiz/c-wiz`
        await page.waitForXPath(topicsXPath);
        const topics = await page.$x(topicsXPath) as ElementHandle<HTMLElement>[];
        // select first h4 tag in each topic
        for (const topic of topics) {
            // Plan, get:
            // 1. Headline Text in first h4 tag
            // 2. URL of headline in first h4 tag
            // 3. URL of "Liputan Lengkap" button
            try {
                const headlineselector = "article";
                await topic.waitForSelector(headlineselector);
                const liputanLengkapSelector = `a[aria-label="Liputan Lengkap"]`;
                const liputanLengkap = await topic?.$(liputanLengkapSelector);
                const liputanlengkapurl = await liputanLengkap?.getProperty("href");
                headlinesList.push({
                    storiesURL: await liputanlengkapurl?.jsonValue() as string ?? null,
                    completeNews: [],
                });
                if (headlinesList.length >= limit) {
                    break;
                }
            } catch (e) {
                if (e instanceof Error) {
                    console.log("Error in crawlGoogleNews");
                    console.log(e);
                } else {
                    console.log("Unknown error");
                }
            }
        }
        await newPage.close()
        await page.close();
    } catch (e) {
        if (e instanceof Error) {
            console.log("Error in crawlGoogleNews");
            console.log(e.message);
        } else {
            console.log("Unknown error");
        }
    }
    return headlinesList;
}

async function crawlLiputanLengkap(browser: Browser,
    headlinesList: Headline[]
    ) {
    console.log("Crawling Liputan Lengkap...");
    const page = await browser.newPage();
    const newPage = await browser.newPage();
    await newPage.setRequestInterception(true);
    newPage.on("request", async (request) => {
        // await request.abort();
    })
    for (const headline of headlinesList) {
        console.log(`Crawling Liputan Lengkap of ${headline.storiesURL}...`);
        try {
            page.bringToFront();
            await page.goto(headline.storiesURL as string);
            const mainNewsXPath = `/html/body/c-wiz/div/div[2]/c-wiz/div/div[2]/div/main/c-wiz/div/div/main/div[1]/div[1]/div/div[2]`;
            await page.waitForXPath(mainNewsXPath);
            const [mainNews] = await page.$x(mainNewsXPath) as ElementHandle<HTMLElement>[];
            const articles = await mainNews.$$("article");
            for (const article of articles) {
                const titleSelector = "h4";
                const title = await article.$(titleSelector);
                const titleText = await title?.getProperty("innerText");
                const thumbnailSelector = "figure > img";
                const thumbnail = await article.$(thumbnailSelector);
                const thumbnailText = await thumbnail?.getProperty("src");
                const sourceSelector = "div[1]"
                const source = await article.$x(sourceSelector) as ElementHandle<HTMLElement>[];
                const sourceLogoSelector = "img";
                const sourceNameSelector = "div";
                const sourceLogo = await source[0]?.$x(sourceLogoSelector);
                const sourceName = await source[0]?.$x(sourceNameSelector);
                // sourceName can be either img or div
                const sourceLogoText = await sourceLogo[0]?.getProperty("src");
                const sourceNameText = await sourceName[0]?.getProperty("innerText") || await sourceName[0]?.getProperty("src");
                const sourceTimeSelector = "time";
                const sourceTimeText = await article.$eval(sourceTimeSelector, (el) => el.getAttribute("datetime"));
                const urlSelector = "a";
                const url = await article.$(urlSelector);
                const urlText = await url?.getProperty("href");
                await newPage.bringToFront();
                await newPage.goto(await urlText?.jsonValue() as string);
                await newPage.waitForSelector("a");
                const [rurlanchor] = await newPage.$x('/html/body/c-wiz/div/div[2]/c-wiz/div[3]/a') as ElementHandle<HTMLAnchorElement>[];
                const realurl = await (await rurlanchor?.getProperty("href"))?.jsonValue() as string;
                await page.bringToFront();
                headline.completeNews.push({
                    title: await titleText?.jsonValue() ?? null,
                    thumbnail: await thumbnailText?.jsonValue() ?? null,
                    publisherLogo: await sourceLogoText?.jsonValue() as string ?? null,
                    publisherName: await sourceNameText?.jsonValue() as string ?? null,
                    publishedTime: sourceTimeText ?? null,
                    url: realurl ?? null,
                    content: {
                        excerpt: null,
                    }
                });
            }
        } catch (e) {
            if (e instanceof Error) {
                console.log("Error in crawlLiputanLengkap");
                console.log(e.message);
            } else {
                console.log("Unknown error");
            }
        }
    }
    await newPage.close()
    await page.close();
    return headlinesList;
}

async function crawlContent(browser: Browser,
    writer: PrismaClient, headlinesList: Headline[]
) {
    await writer.$connect();
    console.log("Crawling content...")
    const page = await browser.newPage();
    await page.setRequestInterception(true); // enable request interception

    page.on(PageEmittedEvents.Request, (req) => {
        if (!["document", "xhr", "fetch", "script", "image", "video", "stylesheet", "font"].includes(req.resourceType())) {
        return req.abort();
        }
        req.continue();
    });
    for (const headline of headlinesList) {
        try {
            const isHeadlineInDB = await writer.headline.findUnique({
                where: {
                    referrer: await storyURLtoStoryID(headline.storiesURL as string),
                }
            });
            for (const liputan of headline.completeNews as News[]) {
                if (!liputan.url) {
                    continue;
                } else if (
                    await writer.news.findUnique({
                        where: {
                            url: liputan.url,
                        }
                    })
                ) {
                    console.log("News already in database");
                    continue;
                } else {
                    console.log(`Crawling ${liputan.title}...`);
                }
                try {
                    await page.goto(liputan.url as string, {
                        waitUntil: "domcontentloaded",
                    });
                } catch (e) {;} // do nothing
                const html = await page.content();
                const dom = new JSDOM(html, {
                    url: liputan.url as string,
                    virtualConsole: virtualConsole,
                });
                const reader = new Readability(dom.window.document);
                const article = reader.parse();
                liputan.content = {
                    excerpt: article?.excerpt ?? null,
                };
            }
            // write all news
            for (const liputan of headline.completeNews as News[]) {
                if (!liputan.url) {
                    continue;
                } else if (
                    await writer.news.findUnique({
                        where: {
                            url: liputan.url,
                        }
                    })
                ) {
                    console.log("News already in database");
                    continue;
                } else {
                    console.log(`Writing ${liputan.title}...`);
                }
                if (
                    !liputan.title ||
                    !liputan.publisherLogo ||
                    !liputan.publisherName ||
                    !liputan.publishedTime ||
                    !liputan.url ||
                    !liputan.content.excerpt
                ) {
                    console.log("Missing field");
                    continue;
                }
                await writer.news.create({
                    data: {
                        title: liputan.title,
                        thumbnail: liputan.thumbnail ?? null,
                        publisherLogo: liputan.publisherLogo ,
                        publisherName: liputan.publisherName,
                        publishedAt: new Date(liputan.publishedTime),
                        url: liputan.url,
                        excerpt: liputan.content.excerpt,
                        headlineNewsId: isHeadlineInDB?.id ?? undefined,
                    }
                });
            }
            // write headline
            if (!headline.storiesURL) {
                continue;
            } else if (
                !storyURLtoStoryID(headline.storiesURL)
            ) {
                console.log("Missing field");
                continue;
            } else if (isHeadlineInDB) {
                console.log("Headline already in database");
                continue;
            } else {
                console.log(`Writing ${headline.storiesURL}...`);
                await writer.headline.create({
                    data: {
                        referrer: await storyURLtoStoryID(headline.storiesURL) ?? "",
                        news: {
                            connect: headline.completeNews.map((news) => {
                                return {
                                    url: news.url as string,
                                }
                            }),
                        },
                        coverNews: {
                            connect: headline.completeNews[0].url ? {
                                url: headline.completeNews[0].url as string,
                            } : undefined,
                        }
                    }
                });
            }
        } catch (e) {
            if (e instanceof Error) {
                console.log("Error in crawlContent");
                console.log(e.message);
            } else {
                console.log("Unknown error");
            }
        }
    }
    await writer.$disconnect();
    await page.close();
}

async function main() {

    const prisma = new PrismaClient();
    const qty = 20; 
    console.time("Time"); 
    const browser = await puppeteer.launch({
        headless: true,
    });
    let headlines = await crawlGoogleNews(browser, qty);
    headlines = await crawlLiputanLengkap(browser, headlines);
    await crawlContent(browser, prisma, headlines);
    await prisma.state.upsert({
        where: {
            key: GlobalState.LAST_SCRAPED
        },
        update: {
            value: new Date(),
        },
        create: {
            key: GlobalState.LAST_SCRAPED,
            value: new Date(),
        }
    });
    console.timeEnd("Time");
    // write to file, not timed
    await browser.close();
} 

const waitTime = 1;
console.log(`Waiting ${waitTime/1000}s for server to start...`);
setTimeout(() => {
    main();
}, waitTime);