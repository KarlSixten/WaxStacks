import 'dotenv/config';
import Discogs from 'disconnect';

const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN;
const DISCOGS_USERNAME = process.env.DISCOGS_USERNAME;

const discogs = new Discogs.Client({
  userToken: DISCOGS_TOKEN
});

const currency = 'EUR';
const priceBrackets = [10, 25, 50, 100, 250];

const collection = discogs.user().collection();

const database = discogs.database()

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getFolderNameForPrice(price) {
    let lowerBound = 0;
    for (const upperBound of priceBrackets) {
        if (price <= upperBound) {
            return `€${lowerBound} - €${upperBound}`;
        }
        lowerBound = upperBound;
    }
    return `>€${lowerBound}`;
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

            const stats = await database.getRelease(releaseId);
            console.log(stats);
            
            const lowestPrice = stats?.suggested_prices?.[currency]?.value;
            
            if (lowestPrice === undefined || lowestPrice === null) {
                console.log('  - ⚠️ No median price found. Skipping this record.');
                await wait(apiDelay);
                continue;
            }

            console.log(`  - 💰 Median Price: ${lowestPrice.toFixed(2)} ${currency}`);

            const targetFolderName = getFolderNameForPrice(lowestPrice);
            let targetFolderId;

            if (folderCache.has(targetFolderName)) {
                targetFolderId = folderCache.get(targetFolderName);
                console.log(`  - 📂 Target folder "${targetFolderName}" already exists (ID: ${targetFolderId}).`);
            } else {
                console.log(`  - ✨ Target folder "${targetFolderName}" does not exist. Creating it...`);
                const newFolder = await collection.createFolder(targetFolderName);
                targetFolderId = newFolder.id;
                folderCache.set(targetFolderName, targetFolderId);
                console.log(`  - ✅ Created new folder with ID: ${targetFolderId}`);
            }

            // Move the release if it's not already in the correct folder
            if (currentFolderId === targetFolderId) {
                console.log('  - 👍 Record is already in the correct folder.');
            } else {
                console.log(`  - 🚚 Moving record from folder ${currentFolderId} to ${targetFolderId}...`);
                await collection.editReleaseInstance(DISCOGS_USERNAME, currentFolderId, releaseId, instanceId, { folder_id: targetFolderId });
                console.log('  - ✅ Move successful!');
            }

            // Wait before processing the next record
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