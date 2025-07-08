import 'dotenv/config';
import Discogs from 'disconnect';

import { enterDiscogsToken, enterDiscogsUsername, selectCurrency, selectPriceBrackets } from './prompts.js';

const currencyChoices = [
    { name: 'USD', value: '$' },
    { name: 'GBP', value: '£' },
    { name: 'EUR', value: '€' },
    { name: 'CAD', value: 'C$' },
    { name: 'AUD', value: 'A$' },
    { name: 'JPY', value: '¥' },
    { name: 'CHF', value: 'CHF' },
    { name: 'MXN', value: 'Mex$' },
    { name: 'BRL', value: 'R$' },
    { name: 'NZD', value: 'NZ$' },
    { name: 'SEK', value: 'kr' },
    { name: 'ZAR', value: 'R' },
];

let DISCOGS_USERNAME = process.env.DISCOGS_USERNAME ? process.env.DISCOGS_USERNAME : await enterDiscogsUsername();
let DISCOGS_TOKEN = process.env.DISCOGS_TOKEN ? process.env.DISCOGS_TOKEN : await enterDiscogsToken();
let selectedCurrency = await selectCurrency(currencyChoices);
let priceBrackets = await selectPriceBrackets(selectedCurrency.name);

const discogs = new Discogs.Client({
    userToken: DISCOGS_TOKEN,
});

const collection = discogs.user().collection();

const apiDelay = 3000; // 3 seconds
const rateLimitDelay = 10000 // 10 seconds
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getFolderNameForPrice(price) {
    let lowerBound = 0;
    for (const upperBound of priceBrackets) {
        if (price <= upperBound) {
            return `${selectedCurrency.value}${lowerBound} - ${selectedCurrency.value}${upperBound}`;
        }
        lowerBound = upperBound;
    }
    return `>${selectedCurrency.value}${lowerBound}`;
}

async function organizeCollectionByPrice() {
    console.log('🚀 Starting collection organization...');

    const folderCache = new Map();

    try {
        const existingFolders = await collection.getFolders(DISCOGS_USERNAME);
        for (const folder of existingFolders.folders) {
            folderCache.set(folder.name, folder.id);
        }

        let allReleases = [];
        let page = 1;
        let totalPages = 1;

        console.log('⏳ Fetching all releases from your collection...');
        do {
            const response = await collection.getReleases(DISCOGS_USERNAME, 0, { page, per_page: 250 });
            if (response.releases && response.releases.length > 0) {
                allReleases.push(...response.releases);
                totalPages = response.pagination.pages;
                console.log(`...fetched page ${page} of ${totalPages}`);
                page++;
            } else {
                break;
            }
        } while (page <= totalPages);

        console.log(`✅ Found a total of ${allReleases.length} releases to process.`);

        for (let i = 0; i < allReleases.length; i++) {
            const release = allReleases[i];
            const releaseTitle = release.basic_information.title;
            const releaseId = release.id;
            const instanceId = release.instance_id;
            const currentFolderId = release.folder_id;

            console.log('\n--------------------------------------------------');
            console.log(`Processing ${i + 1}/${allReleases.length}: "${releaseTitle}"`);

            const lowestPrice = await getLowestPriceForRelease(releaseId);

            if (lowestPrice === undefined || lowestPrice === null) {
                console.log('  - ⚠️ No lowest price found. Skipping this record.');
                await wait(apiDelay);
                continue;
            }

            console.log(`  - 💰 Lowest Price: ${lowestPrice.toFixed(2)} ${selectedCurrency.name}`);

            const targetFolderName = getFolderNameForPrice(lowestPrice);
            let targetFolderId;

            if (folderCache.has(targetFolderName)) {
                targetFolderId = folderCache.get(targetFolderName);
                console.log(`  - 📂 Target folder "${targetFolderName}" already exists (ID: ${targetFolderId}).`);
            } else {
                console.log(`  - ✨ Target folder "${targetFolderName}" does not exist. Creating it...`);
                try {
                    const newFolder = await collection.addFolder(DISCOGS_USERNAME, targetFolderName);
                    targetFolderId = newFolder.id;
                    folderCache.set(targetFolderName, targetFolderId);
                    console.log(`  - ✅ Created new folder with ID: ${targetFolderId}`);
                } catch (error) {
                    console.log(error);
                }
            }

            if (currentFolderId === targetFolderId) {
                console.log('  - 👍 Record is already in the correct folder.');
            } else {
                console.log(`  - 🚚 Moving record from folder ${currentFolderId} to ${targetFolderId}...`);
                await collection.editRelease(DISCOGS_USERNAME, currentFolderId, releaseId, instanceId, { folder_id: targetFolderId });
                console.log('  - ✅ Move successful!');
            }

            await wait(apiDelay);
        }

        console.log('\n--------------------------------------------------');
        console.log('🎉 All done! Your collection has been organized by price.');

    } catch (err) {
        console.error('\n❌ A critical error occurred:', err);
        console.error('The script has been stopped. Please check the error message.');
    }
}

organizeCollectionByPrice();

async function getLowestPriceForRelease(releaseId) {
    const url = `https://api.discogs.com/marketplace/stats/${releaseId}?curr_abbr=${selectedCurrency.name}`;
    let response;
    let data;
    let rateLimitRemaining;
  
    do {
      response = await fetch(url);
      rateLimitRemaining = parseInt(response.headers.get('x-discogs-ratelimit-remaining'), 10);      
  
      if (rateLimitRemaining === 0) {
        console.log(`⏳ Rate limit reached (remaining: 0) — waiting ${rateLimitDelay}ms before retrying...`);
        await wait(rateLimitDelay);
      }
  
    } while (rateLimitRemaining === 0);
  
    data = await response.json();
  
    const lowestPrice = data?.lowest_price?.value;
    return lowestPrice;
  }