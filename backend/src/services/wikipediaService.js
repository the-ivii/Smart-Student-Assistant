import axios from 'axios';

const WIKIPEDIA_API_URL = 'https://en.wikipedia.org/w/api.php';
const WIKIPEDIA_SUMMARY_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary/';

/**
 * Searches Wikipedia for a topic and returns the best matching page title
 * @param {string} topic - The topic to search for
 * @returns {Promise<string|null>} Page title or null if not found
 */
/**
 * Fetches extract using MediaWiki API (more reliable)
 * @param {string} pageTitle - The Wikipedia page title
 * @returns {Promise<Object>} Wikipedia extract data
 */
async function fetchExtractFromMediaWiki(pageTitle) {
  try {
    const response = await axios.get(WIKIPEDIA_API_URL, {
      params: {
        action: 'query',
        prop: 'extracts',
        titles: pageTitle,
        explaintext: 1,
        exsectionformat: 'wiki',
        format: 'json',
        exintro: false, // Get full extract, not just intro
        exlimit: 1
      },
      headers: {
        'User-Agent': 'SmartStudyAssistant/1.0 (Educational Project)',
      },
      timeout: 10000
    });

    if (response.data?.query?.pages) {
      const pages = response.data.query.pages;
      const pageId = Object.keys(pages)[0];
      const pageData = pages[pageId];
      
      if (pageData && pageData.extract && pageData.extract.trim().length > 0) {
        return {
          extract: pageData.extract,
          title: pageData.title,
          pageid: pageData.pageid
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('MediaWiki API error:', error.message);
    return null;
  }
}

async function searchWikipediaTopic(topic) {
  try {
    const searchResponse = await axios.get(WIKIPEDIA_API_URL, {
      params: {
        action: 'query',
        list: 'search',
        srsearch: topic,
        format: 'json',
        srlimit: 1, // Get only the top result
        srnamespace: 0, // Only search in main namespace
      },
      headers: {
        'User-Agent': 'SmartStudyAssistant/1.0 (Educational Project)',
      },
      timeout: 8000
    });

    if (searchResponse.data?.query?.search?.length > 0) {
      const pageTitle = searchResponse.data.query.search[0].title;
      console.log(`Wikipedia search found: "${pageTitle}" for query: "${topic}"`);
      return pageTitle;
    }

    return null;
  } catch (error) {
    console.error('Wikipedia search error:', error.message);
    return null;
  }
}

/**
 * Fetches summary data from Wikipedia API
 * @param {string} topic - The topic to search for
 * @returns {Promise<Object>} Wikipedia data or error
 */
export async function fetchWikipediaData(topic) {
  try {
    if (!topic || topic.trim().length === 0) {
      return {
        success: false,
        error: 'Empty topic provided'
      };
    }

    console.log(`Fetching Wikipedia data for: ${topic}`);

    // Step 1: Try MediaWiki API directly with the topic name
    let pageTitle = topic;
    let extractData = await fetchExtractFromMediaWiki(pageTitle);
    
    // Step 2: If direct MediaWiki API fails, try search API to find the correct page
    if (!extractData) {
      console.log(`Direct MediaWiki API failed, trying search API for: ${topic}`);
      const foundTitle = await searchWikipediaTopic(topic);
      if (foundTitle) {
        pageTitle = foundTitle;
        extractData = await fetchExtractFromMediaWiki(pageTitle);
      }
    }

    // Step 3: If MediaWiki API worked, return the data
    if (extractData && extractData.extract) {
      console.log(`✅ Wikipedia extract fetched successfully for: ${extractData.title}`);
      console.log(`📄 Extract length: ${extractData.extract.length} characters`);
      
      // Build the Wikipedia URL
      const wikipediaUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(extractData.title.replace(/\s+/g, '_'))}`;
      
      return {
        success: true,
        extract: extractData.extract,
        title: extractData.title,
        url: wikipediaUrl,
        thumbnail: null // MediaWiki API doesn't provide thumbnail in this format
      };
    }

    // Step 4: Fallback to REST API if MediaWiki API completely fails
    console.log(`⚠️ MediaWiki API failed, trying REST API as fallback`);
    try {
      const encodedTitle = encodeURIComponent(pageTitle);
      const summaryUrl = `${WIKIPEDIA_SUMMARY_URL}${encodedTitle}`;
      
      const response = await axios.get(summaryUrl, {
        headers: {
          'User-Agent': 'SmartStudyAssistant/1.0 (Educational Project)',
        },
        timeout: 8000
      });

      if (response.data && response.data.extract) {
        console.log(`✅ Wikipedia REST API fallback successful for: ${pageTitle}`);
        return {
          success: true,
          extract: response.data.extract,
          title: response.data.title,
          url: response.data.content_urls?.desktop?.page || '',
          thumbnail: response.data.thumbnail?.source || null
        };
      }
    } catch (restError) {
      console.log(`REST API fallback also failed: ${restError.message}`);
    }

    return {
      success: false,
      error: 'Topic not found on Wikipedia or no extract available'
    };

  } catch (error) {
    console.error('Wikipedia API error:', error.message);
    
    if (error.response?.status === 404) {
      return {
        success: false,
        error: 'Topic not found on Wikipedia'
      };
    }

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        success: false,
        error: 'Wikipedia API request timed out'
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to fetch from Wikipedia'
    };
  }
}

