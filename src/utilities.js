export const getArticlesDiff = (fetchedArticles, stateArticles) => {
  const diff = [];
  const filteredArticles = stateArticles.filter(({ feedId }) => (
    feedId === fetchedArticles[0].feedId));
  fetchedArticles.forEach((article) => {
    const articleInState = filteredArticles.find(({ link }) => link === article.link);
    if (!articleInState) diff.unshift(article);
  });
  return diff;
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
  console.log({ rss });
  const parser = new DOMParser();
  const htmlDoc = parser.parseFromString(rss, 'text/xml');
  const channel = htmlDoc.querySelector('channel');
  console.log({ channel });
  const rssTitle = channel.querySelector('title').textContent;
  const rssDescription = channel.querySelector('description').textContent;
  const rssLink = url;
  const articlesDomList = channel.querySelectorAll('item');
  console.log({ rssTitle });
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
  console.log(feedsWithIds);
  return new Promise((resolve) => {
    if (articlesArrayList.length > 4) {
      resolve(feedsWithIds);
    }
    throw new Error('jffdkssdsfdfdewrewr');
  });
};
