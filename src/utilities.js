import ParseError from './parseError.js';

export const getFeed = (url, axiosInstance) => axiosInstance
  .get(`get?url=${encodeURIComponent(url)}&disableCache=true`)
  .then((response) => {
    if (response.status === 200 && response?.data?.contents) {
      return { url, rss: response.data.contents };
    }
    throw new Error('network_error');
  });

const getFeedIndexInState = (fetchedFeed, stateFeeds) => (
  stateFeeds.map(({ link }) => link).indexOf(fetchedFeed.link));

const getFeedNextId = (fetchedFeed, stateFeeds) => {
  const indexOfFeedInState = getFeedIndexInState(fetchedFeed, stateFeeds);
  if (indexOfFeedInState !== -1) {
    return stateFeeds[indexOfFeedInState].id;
  }
  return stateFeeds.length > 0 ? Math.max(...stateFeeds.map(({ id }) => id)) + 1 : 0;
};

const getPostNextId = (fetchedFeed, stateFeeds, statePosts) => {
  const indexOfFeedInState = getFeedIndexInState(fetchedFeed, stateFeeds);
  if (indexOfFeedInState !== -1) {
    const filteredPosts = statePosts.filter(({ feedId }) => (
      feedId === stateFeeds[indexOfFeedInState].id));
    return filteredPosts.length;
  }
  return 0;
};

const getNewPosts = (fetchedFeed, fetchedPosts, stateFeeds, statePosts) => {
  const indexOfFeedInState = getFeedIndexInState(fetchedFeed, stateFeeds);
  if (indexOfFeedInState !== -1) {
    const newPosts = [];
    const filteredPosts = statePosts.filter(({ feedId }) => (
      feedId === stateFeeds[indexOfFeedInState].id));
    fetchedPosts.forEach((post) => {
      const articleInState = filteredPosts
        .map(({ link }) => link)
        .includes(post.link);
      if (articleInState) newPosts.push(post);
    });
    return newPosts;
  }
  return fetchedPosts;
};

export const getNewFeedsWithIds = (fetchedFeeds, stateFeeds, statePosts) => {
  const feedsClone = fetchedFeeds.feedList.slice();
  const feedId = getFeedNextId(fetchedFeeds.feedList[0], stateFeeds);
  const feedsWithIds = feedsClone.map((feed) => ({ ...feed, id: feedId }));
  const newPosts = getNewPosts(
    fetchedFeeds.feedList[0],
    fetchedFeeds.articlesList,
    stateFeeds,
    statePosts,
  );
  const postNextId = getPostNextId(fetchedFeeds.feedList[0], stateFeeds, statePosts);
  const newPostsWithIds = newPosts.length > 0 ? newPosts
    .map((post, id) => ({ ...post, feedId, id: postNextId + id })) : [];
  return Promise
    .resolve({ feedList: feedsWithIds, articlesList: newPostsWithIds });
};

export const updateFeeds = (...params) => {
  const [watchedState, fetchFeed, parseRss, axiosInstance, fetchInterval] = params;
  Promise
    .all(watchedState.feedList
      .map(({ link }) => fetchFeed(link, axiosInstance)
        .then(({ url, rss }) => parseRss(rss, url))
        .then((fetchedFeeds) => (
          getNewFeedsWithIds(fetchedFeeds, watchedState.feedList, watchedState.articles)))))
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

const parseArticle = (rssItem) => {
  const itemTitle = rssItem.querySelector('title').textContent;
  const itemDescription = rssItem.querySelector('description').textContent;
  const itemLink = rssItem.querySelector('link').textContent;
  return {
    title: itemTitle,
    description: itemDescription,
    link: itemLink,
  };
};

export const parseRss = (rss, url) => {
  const feedObj = {
    feedList: [],
    articlesList: [],
  };
  const parser = new DOMParser();
  const htmlDoc = parser.parseFromString(rss, 'text/xml');
  const errorNode = htmlDoc.querySelector('parsererror');
  if (errorNode) throw new ParseError('Parse rss error');
  const channel = htmlDoc.querySelector('channel');
  const articlesDomList = channel.querySelectorAll('item');
  const articlesArrayList = Array.prototype.slice.call(articlesDomList).map(parseArticle);
  feedObj.feedList.push({
    title: channel.querySelector('title').textContent,
    description: channel.querySelector('description').textContent,
    link: url,
  });
  feedObj.articlesList = Array.isArray(articlesArrayList) && articlesArrayList.length > 0
    ? articlesArrayList
    : [];
  return Promise.resolve(feedObj);
};
