const generateFeedId = (rssLink, oldFeedList) => {
  if (oldFeedList.length > 0) {
    const indexOfFeed = oldFeedList.map(({ link }) => link).indexOf(rssLink);
    const currentId = indexOfFeed !== -1
      ? oldFeedList[indexOfFeed]?.id
      : Math.max(...oldFeedList.map(({ id }) => id)) + 1;
    return currentId;
  }
  return 0;
};

export const rssParser = (rss, oldFeedList) => {
  const feedObj = {
    feedList: [],
    articlesList: [],
  };
  const parser = new DOMParser();
  const htmlDoc = parser.parseFromString(rss, 'text/xml');
  const channel = htmlDoc.querySelector('channel');
  const rssTitle = channel.querySelector('title').textContent;
  const rssDescription = channel.querySelector('description').textContent;
  const rssLink = channel.querySelector('link').textContent;
  const articlesDomList = channel.querySelectorAll('item');
  const currentId = generateFeedId(rssLink, oldFeedList);
  const articlesArrayList = Array.prototype.slice.call(articlesDomList).map((item) => {
    const itemTitle = item.querySelector('title').textContent;
    const itemDescription = item.querySelector('description').textContent;
    const itemLink = item.querySelector('link').textContent;
    return {
      title: itemTitle,
      description: itemDescription,
      link: itemLink,
      feedId: currentId,
    };
  });
  feedObj.feedList.push({
    id: currentId,
    title: rssTitle,
    description: rssDescription,
    link: rssLink,
  });
  feedObj.articlesList = Array.isArray(articlesArrayList) && articlesArrayList.length > 0
    ? articlesArrayList
    : [];
  console.log(htmlDoc, articlesArrayList);
  return new Promise((resolve) => {
    if (articlesArrayList.length > 4) {
      resolve(feedObj);
    }
    throw new Error('jffdkssdsfdfdewrewr');
  });
};

export const someFunction = () => 5;
