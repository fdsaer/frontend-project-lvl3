const renderFeed = (item) => {
  const feedItem = document.createElement('li');
  const feedHeader = document.createElement('h3');
  const feedDescription = document.createElement('p');
  feedItem.classList.add('list-group-item', 'border-0', 'border-end-0');
  feedHeader.classList.add('h6', 'm-0');
  feedDescription.classList.add('m-0', 'small', 'text-black-50');
  feedHeader.innerHTML = item.title;
  feedDescription.innerHTML = item.description;
  feedItem.append(feedHeader, feedDescription);
  return feedItem;
};

const renderPost = (item, i18instance) => {
  const postItem = document.createElement('li');
  const postLink = document.createElement('a');
  const postButton = document.createElement('button');
  postItem.classList.add('list-group-item', 'd-flex', 'justify-content-between');
  postItem.classList.add('align-items-start', 'border-0', 'border-end-0');
  if (item?.visited) {
    postLink.classList.add('fw-normal', 'link-secondary');
  } else {
    postLink.classList.add('fw-bold');
  }
  postButton.classList.add('btn', 'btn-outline-primary', 'btn-sm');
  postLink.innerHTML = item.title;
  postLink.setAttribute('href', item.link);
  postLink.setAttribute('data-id', `${item.feedId}_${item.id}`);
  postLink.setAttribute('target', '_blank');
  postLink.setAttribute('rel', 'noopener noreferrer');
  postButton.innerHTML = i18instance('watching');
  postButton.setAttribute('type', 'button');
  postButton.setAttribute('data-id', `${item.feedId}_${item.id}`);
  postButton.setAttribute('data-bs-toggle', 'modal');
  postButton.setAttribute('data-bs-target', '#modal');
  postItem.append(postLink, postButton);
  return postItem;
};

const createTemplates = () => {
  const card = document.createElement('div');
  const cardBody = document.createElement('div');
  const cardList = document.createElement('ul');
  const cardHeader = document.createElement('h4');
  card.classList.add('card', 'border-0');
  cardBody.classList.add('card-body');
  cardList.classList.add('list-group', 'border-0', 'rounded-0');
  cardHeader.classList.add('card-title', 'h4');
  return {
    card, cardBody, cardList, cardHeader,
  };
};

const createPostsCard = (card, cardBody, cardList, cardHeader, i18instance, articles) => {
  const postsHeader = cardHeader.cloneNode(false);
  postsHeader.innerHTML = i18instance('posts');
  const postsCardBody = cardBody.cloneNode(false);
  const postsCard = card.cloneNode(false);
  const postsList = cardList.cloneNode(false);
  postsCardBody.appendChild(postsHeader);
  postsList.append(...articles.map((item) => renderPost(item, i18instance)));
  postsCard.append(postsCardBody, postsList);
  return postsCard;
};

const createFeedsCard = (card, cardBody, cardList, cardHeader, i18instance, feedList) => {
  const feedsHeader = cardHeader.cloneNode(false);
  feedsHeader.innerHTML = i18instance('feeds');
  const feedsCardBody = cardBody.cloneNode(false);
  const feedsCard = card.cloneNode(false);
  const feedsList = cardList.cloneNode(false);
  feedsCardBody.appendChild(feedsHeader);
  feedsList.append(...feedList.map((item) => renderFeed(item)));
  feedsCard.append(feedsCardBody, feedsList);
  return feedsCard;
};

const renderContent = (feedList, articles, feedsEl, postsEl, i18instance) => {
  const listOfFeeds = feedsEl.querySelector('ul');
  const listOfPosts = postsEl.querySelector('ul');
  if (!listOfFeeds && !listOfPosts) {
    const {
      card, cardBody, cardList, cardHeader,
    } = createTemplates();
    const postsCard = createPostsCard(card, cardBody, cardList, cardHeader, i18instance, articles);
    const feedsCard = createFeedsCard(card, cardBody, cardList, cardHeader, i18instance, feedList);

    postsEl.appendChild(postsCard);
    feedsEl.appendChild(feedsCard);
  } else {
    listOfFeeds.innerHTML = '';
    listOfPosts.innerHTML = '';
    listOfFeeds.append(...feedList.map((item) => renderFeed(item)));
    listOfPosts.append(...articles.map((item) => renderPost(item, i18instance)));
  }
};

const switchValidationStyles = (watchedState, elements) => {
  const { form: { feedbackString }, form: { urlInput } } = elements;
  if (watchedState.validationState === 'invalid') {
    urlInput.classList.add('is-invalid');
    feedbackString.classList.remove('text-success');
    feedbackString.classList.add('text-danger');
    feedbackString.textContent = watchedState.error;
  } else {
    urlInput.classList.remove('is-invalid');
    feedbackString.classList.remove('text-danger');
    feedbackString.classList.add('text-success');
    feedbackString.textContent = '';
  }
};

const switchFetchStateStyles = (watchedState, elements, i18instance) => {
  const { form: { feedbackString }, form: { urlInput }, form: { addButton } } = elements;
  const { content: { feeds }, content: { posts } } = elements;
  if (watchedState.state === 'filling') {
    urlInput.classList.remove('is-invalid');
    feedbackString.textContent = '';
  } else if (watchedState.state === 'processing') {
    urlInput.setAttribute('readonly', 'true');
    addButton.setAttribute('disabled', 'true');
  } else if (watchedState.state === 'success') {
    urlInput.removeAttribute('readonly');
    addButton.removeAttribute('disabled');
    urlInput.focus();
    urlInput.value = '';
    renderContent(watchedState.feedList, watchedState.articles, feeds, posts, i18instance);
    feedbackString.textContent = i18instance('feed_loaded');
  } else if (watchedState.state === 'failed') {
    urlInput.removeAttribute('readonly');
    addButton.removeAttribute('disabled');
    urlInput.focus();
  }
};

export const modalWatcher = (onChange, state, elements) => {
  const { modalBody, modalTitle, modalLinkButton } = elements;
  const watchedState = onChange(state.uiState, () => {
    modalTitle.textContent = watchedState.currentArticle.title;
    modalBody.innerHTML = `<p>${watchedState.currentArticle.description}</p>`;
    modalLinkButton.setAttribute('href', watchedState.currentArticle.link);
  });
  return watchedState;
};

export default (onChange, state, elements, i18instance) => {
  const watchedState = onChange(state.queryProcess, () => {
    switchValidationStyles(watchedState, elements);
    switchFetchStateStyles(watchedState, elements, i18instance);
  });
  return watchedState;
};
