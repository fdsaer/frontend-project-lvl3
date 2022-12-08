import ParseError from './parseError.js';

export const getFeed = (url, axiosInstance) => axiosInstance
  .get(`get?url=${encodeURIComponent(url)}&disableCache=true`)
  .then((response) => {
    if (response.status === 200 && response?.data?.contents) {
      return { url, rss: response.data.contents };
    }
    throw new Error('network_error');
  });

export const updateFeeds = (...params) => {
  const [watchedState, fetchFeed, rssParser, axiosInstance, fetchInterval] = params;
  Promise
    .all(watchedState.feedList.map(({ link }) => fetchFeed(link, axiosInstance)
      .then(({ url, rss }) => rssParser(rss, watchedState.feedList, watchedState.articles, url))))
    .then((feedObjects) => {
      const arrs = [];
      feedObjects.forEach(({ articlesList }) => {
        arrs.unshift(...articlesList);
      });
      if (arrs.length > 0) watchedState.articles.unshift(...arrs);
    })
    .catch((err) => {
      console.log(err);
    });
  const timer = setTimeout(() => { updateFeeds(...params); }, fetchInterval);
  return timer;
};

const getIds = (fetchedFeeds, stateFeeds, stateArticles) => {
  const feedsClone = fetchedFeeds.feedList.slice();
  const articlesClone = fetchedFeeds.articlesList.slice();
  const indexOfFeedInState = stateFeeds.map(({ link }) => link).indexOf(feedsClone[0].link);
  if (indexOfFeedInState !== -1) {
    const newArticles = [];
    const feedId = stateFeeds[indexOfFeedInState]?.id;
    const feedsWithIds = feedsClone.map((feed) => ({ ...feed, id: feedId }));
    const filteredArticles = stateArticles.filter(({ feedId: stateArticleFeedId }) => (
      feedId === stateArticleFeedId));
    articlesClone.forEach((article) => {
      const articleInState = filteredArticles.find(({ link }) => link === article.link);
      if (!articleInState) newArticles.unshift(article);
    });
    const articlesWithIds = newArticles
      .map((article, id) => ({ ...article, feedId, id: id + filteredArticles.length }));
    return { feedList: feedsWithIds, articlesList: articlesWithIds };
  }
  const feedId = stateFeeds.length > 0 ? Math.max(...stateFeeds.map(({ id }) => id)) + 1 : 0;
  const feedsWithIds = feedsClone.map((feed) => ({ ...feed, id: feedId }));
  const articlesWithIds = articlesClone
    .map((article, id) => ({ ...article, feedId, id }));
  return { feedList: feedsWithIds, articlesList: articlesWithIds };
};

export const rssParser = (rss, stateFeeds, stateArticles, url) => {
  const feedObj = {
    feedList: [],
    articlesList: [],
  };
  const parser = new DOMParser();
  const htmlDoc = parser.parseFromString(rss, 'text/xml');
  const errorNode = htmlDoc.querySelector('parsererror');
  if (errorNode) {
    throw new ParseError('Parse rss error');
  }
  const channel = htmlDoc.querySelector('channel');
  const rssTitle = channel.querySelector('title').textContent;
  const rssDescription = channel.querySelector('description').textContent;
  const rssLink = url;
  const articlesDomList = channel.querySelectorAll('item');
  const articlesArrayList = Array.prototype.slice.call(articlesDomList).map((item) => {
    const itemTitle = item.querySelector('title').textContent;
    const itemDescription = item.querySelector('description').textContent;
    const itemLink = item.querySelector('link').textContent;
    return {
      title: itemTitle,
      description: itemDescription,
      link: itemLink,
    };
  });
  feedObj.feedList.push({
    title: rssTitle,
    description: rssDescription,
    link: rssLink,
  });
  feedObj.articlesList = Array.isArray(articlesArrayList) && articlesArrayList.length > 0
    ? articlesArrayList
    : [];
  const feedsWithIds = getIds(feedObj, stateFeeds, stateArticles);
  return Promise.resolve(feedsWithIds);
};
