const helper = require("./helper");
const changeMonitor = require("./changeMonitor");
const constant = require("../constants");

async function monitorSitemaps() {
  const allChanges = {};
  try {
    helper.createFolderIfNotExists(constant.FOLDER_PATH);

    const fetchPromises = constant.SITEMAP_URL.map(async (url) => {
      const changes = await changeMonitor.getSitemapChanges(url);
      if (changes) {
        allChanges[url] = changes;
      }
    });

    await Promise.all(fetchPromises);
  } catch (error) {
    console.error("Error monitoring sitemaps:", error);
  }
}

// Call the main monitoring function
monitorSitemaps();
