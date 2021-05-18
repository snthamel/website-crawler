const commandLineArgs = require("command-line-args");
const mysqlDbClient = require('./connections/mysqldb-pool');
const got = require('got');
const cheerio = require('cheerio');
const { log } = require("./services/log.service");
const fs = require('fs');
const { mysql_db_table_name, keywords_file_path } = require('./config/config');
const cliProgress = require('cli-progress');

const commandArgs = commandLineArgs([
    {
        name: "check",
        type: Boolean
    },
    {
        name: "crawl",
        type: Boolean
    },
    {
        name: "urls",
        type: String,
        alias: 'u'
    }
], { camelCase: true });

let urls = [];
const output = [];
let crawledUrls = [];

const checkConnections = async () => {
    await mysqlDbClient.query("show status like 'Conn%';");
    await mysqlDbClient.query("SELECT * FROM locations LIMIT 10;");
    log.info(`MySQL database successfully connected`);
};

const crawlForMatchingWebsites = async () => {
    crawledUrls = [];
    const keywords = (fs.readFileSync(keywords_file_path, 'utf8')).split('\n');
    const locations = await fetchLocations();
    for (const url of urls) {
        await crawlForMatchingKeywords(url, keywords, locations);
        if (output.length >= 5) break;
    }
    log.info(`crawlForMatchingWebsites completed`);
}

const fetchLocations = () => {
    return new Promise((resolve, reject) => {
        mysqlDbClient.query(
            `SELECT name FROM ${mysql_db_table_name};`,
            (err, data) => {
                if (err) return reject(err);
                resolve(data.map(location => location.name));
            }
        );
    })
}

const crawlForMatchingKeywords = async (url, keywords, locations, isSublink = false) => {
    if (output.length >= 5) return;

    // Check if url already exists in output
    const currentUrl = new URL(url);
    let skipUrl = false;
    [].concat.apply([], ([].concat.apply([], output))).forEach(val => {
        if (val.includes(currentUrl.hostname) || val.includes(currentUrl.hostname.replace('www.', ''))) {
            skipUrl = true;
        }
    });
    // Check if url already crawled
    if (crawledUrls.includes(url)) skipUrl = true;
    if (skipUrl) return;

    log.info(`Crawling URL: ${url}`);
    const kwProgress = getProgressbar('keywords');
    const locationProgress = getProgressbar('locations');
    await got(url).then(async response => {
        crawledUrls.push(url);
        const $ = cheerio.load(response.body);
        const matches = {
            keywords: [],
            locations: []
        };
        kwProgress.start(keywords.length, 0);
        for (const keyword of keywords) {
            $('body').each((i, elem) => findMatches($(elem), keyword, matches));
            $('h1').each((i, elem) => findMatches($(elem), keyword, matches));
            $('h2').each((i, elem) => findMatches($(elem), keyword, matches));
            $('h3').each((i, elem) => findMatches($(elem), keyword, matches));
            $('h4').each((i, elem) => findMatches($(elem), keyword, matches));
            $('h5').each((i, elem) => findMatches($(elem), keyword, matches));
            $('h6').each((i, elem) => findMatches($(elem), keyword, matches));
            $('p').each((i, elem) => findMatches($(elem), keyword, matches));
            kwProgress.increment();
        }
        kwProgress.stop();
        locationProgress.start(locations.length, 0);
        for (const location of locations) {
            $('body').each((i, elem) => findLocations($(elem), location, matches));
            $('h1').each((i, elem) => findLocations($(elem), location, matches));
            $('h2').each((i, elem) => findLocations($(elem), location, matches));
            $('h3').each((i, elem) => findLocations($(elem), location, matches));
            $('h4').each((i, elem) => findLocations($(elem), location, matches));
            $('h5').each((i, elem) => findLocations($(elem), location, matches));
            $('h6').each((i, elem) => findLocations($(elem), location, matches));
            $('p').each((i, elem) => findLocations($(elem), location, matches));
            locationProgress.increment();
        }
        locationProgress.stop();
        if (matches.keywords.length && matches.locations.length) {
            output.push([
                "=========================",
                `URL: ${url}`,
                `Keywords found: ${matches.keywords.join(', ')}`,
                `Locations mentioned: ${matches.locations.join(', ')}`,
                ''
            ]);
            if (output.length >= 5) return;
        }
        if (!isSublink) {
            const subLinks = [];
            $(`a[href]`).filter((i, link) => {
                return !link.attribs.href.includes(currentUrl.hostname) 
                    && !link.attribs.href.includes(currentUrl.hostname.replace('www.', ''))
                    && validateUrl(link.attribs.href)
            }).each((i, link) => {
                subLinks.push(link.attribs.href);
            });
            for (const link of subLinks) {
                if (output.length >= 5) break;
                await crawlForMatchingKeywords(link, keywords, locations, true);
            }
        }
    }).catch(err => {
        log.debug(`err: ${err.stack}`);
    });
}

const findMatches = (elem, keyword, matches) => {
    if (elem.text().includes(keyword) && matches.keywords.indexOf(keyword) == -1) {
        matches.keywords.push(keyword);
    }
}

const findLocations = (elem, location, matches) => {
    if (elem.text().includes(location) && matches.locations.indexOf(location) == -1) {
        matches.locations.push(location);
    }
}

const getProgressbar = (type) => {
    return new cliProgress.SingleBar({
        format: `Matching ${type} [{bar}] {percentage}% | Duration: {duration}s | {value}/{total} `
    }, cliProgress.Presets.legacy);
}

const validateUrl = value => {
    return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
}

const writeOutput = async () => {
    var file = fs.createWriteStream('./src/output/output.txt');
    file.on('error', function(err) { log.error(err.stack) });
    output.forEach(outputBlock => outputBlock.forEach(line => { file.write(line + '\n'); }));
    file.end();

    [].concat.apply([], ([].concat.apply([], output))).forEach(line => console.log(line));
}

(async () => {
    try {
        if (commandArgs.check) {
            await checkConnections();
        } else if (commandArgs.crawl) {
            if (!commandArgs.urls) {
                log.error('URLs are not specified. Please specify at least one URL');
                return;
            }
            urls = commandArgs.urls && commandArgs.urls.split(',');
            await crawlForMatchingWebsites();
            await writeOutput();
        } else {
            log.info('no option specified. exit!')
        }
    } catch (error) {
        log.error(`Exception: ${error.stack}`);
    } finally {
        mysqlDbClient.end(function (err) {
            if (err) log.error(err.stack)
            if (commandArgs && commandArgs.check) {
                log.info(`MySQL connections have been closed sucecssfully`);
            } else {
                log.debug(`MySQL connections have been closed sucecssfully`);
            }
        });
    }
})();
