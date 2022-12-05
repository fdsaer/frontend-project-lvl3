import './style.scss';
import onChange from 'on-change';

const mainPart = document.querySelector('main');
const urlInput = document.getElementById('url-input');
const feedbackString = document.querySelector('.feedback');
const queryForm = document.querySelector('.rss-form');
const addButton = queryForm.querySelector('button');

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

const renderPost = (item) => {
  const postItem = document.createElement('li');
  const postLink = document.createElement('a');
  const postButton = document.createElement('button');
  postItem.classList.add(
    'list-group-item',
    'd-flex',
    'justify-content-between',
    'align-items-start',
    'border-0',
    'border-end-0',
  );
  postLink.classList.add('fw-bold');
  postButton.classList.add('btn', 'btn-outline-primary', 'btn-sm');
  postLink.innerHTML = item.title;
  postLink.setAttribute('href', item.link);
  postLink.setAttribute('data-id', '2');
  postLink.setAttribute('target', '_blank');
  postLink.setAttribute('rel', 'noopener noreferrer');
  postButton.innerHTML = 'Просмотр';
  postButton.setAttribute('type', 'button');
  postButton.setAttribute('data-id', '2');
  postButton.setAttribute('data-bs-toggle', 'modal');
  postButton.setAttribute('data-bs-target', '#modal');
  postItem.append(postLink, postButton);
  return postItem;
};

const renderFeeds = (feedList, articles) => {
  const feeds = document.querySelector('.feeds');
  const posts = document.querySelector('.posts');
  if (!feeds && !posts) {
    const section = document.createElement('section');
    const row = document.createElement('div');
    const col1 = document.createElement('div');
    const col2 = document.createElement('div');
    const card = document.createElement('div');
    const cardBody = document.createElement('div');
    const cardList = document.createElement('ul');
    const cardHeader = document.createElement('h4');
    section.classList.add('container-fluid', 'container-xxl', 'p-5');
    row.classList.add('row');
    col1.classList.add('col-md-10', 'col-lg-8', 'order-1', 'mx-auto', 'posts');
    col2.classList.add('col-md-10', 'col-lg-4', 'mx-auto', 'order-0', 'order-lg-1', 'feeds');
    card.classList.add('card', 'border-0');
    cardBody.classList.add('card-body');
    cardList.classList.add('list-group', 'border-0', 'rounded-0');
    cardHeader.classList.add('card-title', 'h4');

    const postsHeader = cardHeader.cloneNode(false);
    const feedsHeader = cardHeader.cloneNode(false);
    postsHeader.innerHTML = 'Посты';
    feedsHeader.innerHTML = 'Фиды';

    const postsCardBody = cardBody.cloneNode(false);
    const feedsCardBody = cardBody.cloneNode(false);
    const postsCard = card.cloneNode(false);
    const feedsCard = card.cloneNode(false);
    const postsList = cardList.cloneNode(false);
    const feedsList = cardList.cloneNode(false);
    postsCardBody.appendChild(postsHeader);
    feedsCardBody.appendChild(feedsHeader);
    feedsList.append(...feedList.map((item) => renderFeed(item)));
    postsList.append(...articles.map((item) => renderPost(item)));
    feedsCard.append(feedsCardBody, feedsList);
    postsCard.append(postsCardBody, postsList);

    col1.appendChild(postsCard);
    col2.appendChild(feedsCard);
    section.appendChild(row).append(col1, col2);
    mainPart.append(section);
  } else {
    const listOfFeeds = feeds.querySelector('ul');
    const listOfPosts = posts.querySelector('ul');
    listOfFeeds.innerHTML = '';
    listOfPosts.innerHTML = '';
    listOfFeeds.append(...feedList.map((item) => renderFeed(item)));
    listOfPosts.append(...articles.map((item) => renderPost(item)));
  }
};

export default (state) => {
  console.log('initialing onChange');
  console.log({ state });
  const watchedState = onChange(state.queryProcess, () => {
    console.log('i am in watcher');
    console.log({ currentState: watchedState });
    if (watchedState.validationState === 'invalid') {
      console.log('invalid');
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
    if (watchedState.state === 'filling') {
      urlInput.classList.remove('is-invalid');
      feedbackString.textContent = '';
    } else if (watchedState.state === 'processing') {
      urlInput.setAttribute('readonly', 'true');
      addButton.setAttribute('disabled', 'true');
    } else if (watchedState.state === 'success') {
      console.log('success');
      urlInput.removeAttribute('readonly');
      addButton.removeAttribute('disabled');
      urlInput.focus();
      urlInput.value = '';
      renderFeeds(watchedState.feedList, watchedState.articles);
      feedbackString.textContent = 'RSS успешно загружен';
    } else if (watchedState.state === 'failed') {
      console.log('fail');
      urlInput.removeAttribute('readonly');
      addButton.removeAttribute('disabled');
      urlInput.focus();
    }
  });
  return watchedState;
};
