const axios = require("axios");
const path = require("path");
const fs = require("fs/promises");
const { parseString } = require("xml2js");

const constant = require("../constants");

async function fetchAndStoreSitemap(url, folderPath) {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36",
      },
    });

    const parsed = await new Promise((resolve, reject) => {
      parseString(response.data, (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });

    return parsed.sitemapindex.sitemap;
  } catch (error) {
    console.error("Error fetching and storing sitemap:", error);
    return null;
  }
}

async function readPreviousState(filePath) {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading previous state: ${error.message}`);
    return [];
  }
}

function compareSitemaps(previousUrls, currentUrls) {
  const newUrls = [];
  const modifiedUrls = [];
  const deletedUrls = [];

  const prevUrlMap = new Map(
    previousUrls.map((url) => [url.loc[0], url.lastmod[0]])
  );

  for (const { loc, lastmod } of currentUrls) {
    if (!prevUrlMap.has(loc[0])) {
      newUrls.push(loc[0]);
    } else if (
      !prevUrlMap.get(loc[0]) ||
      new Date(lastmod[0]) > new Date(prevUrlMap.get(loc[0]))
    ) {
      modifiedUrls.push(loc[0]);
    }
    prevUrlMap.delete(loc[0]);
  }

  deletedUrls.push(...prevUrlMap.keys());

  return { newUrls, modifiedUrls, deletedUrls };
}

async function writeSitemapToFile(filePath, sitemaps) {
  await fs.writeFile(filePath, JSON.stringify(sitemaps), "utf8");
}

async function getSitemapChanges(url) {
  const rootFolderPath = constant.FOLDER_PATH;

  try {
    const sitemaps = await fetchAndStoreSitemap(url, rootFolderPath);
    const filePath = path.join(rootFolderPath, path.basename(url));
    const prevFileData = await readPreviousState(filePath);

    const changes = compareSitemaps(prevFileData, sitemaps);

    if (
      changes.newUrls.length ||
      changes.modifiedUrls.length ||
      changes.deletedUrls.length
    ) {
      await writeSitemapToFile(filePath, sitemaps);
      return changes;
    }
    return;
  } catch (error) {
    console.error("Error processing sitemap changes:", error);
  }
}

module.exports = { getSitemapChanges };
