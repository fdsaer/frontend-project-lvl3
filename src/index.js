import './style.scss';
import { setLocale, string, ValidationError } from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import view, { modalWatcher } from './view.js';
import { baseURL, fetchInterval } from './constants.js';
import { rssParser } from './utilities.js';
import 'bootstrap';

const queryForm = document.querySelector('.rss-form');
const urlInput = document.getElementById('url-input');
const mainPart = document.querySelector('main');

const state = {
  queryProcess: {
    state: 'filling',
    formValue: '',
    error: '',
    validationState: 'valid',
    feedList: [],
    articles: [],
  },
  timer: '',
  uiState: {
    visitedArticles: [],
    currentArticle: {},
  },
};

i18next.init({
  lng: 'ru',
  debug: true,
  resources: {
    ru: {
      translation: {
        default: 'Ошибка заполнения поля',
        url: 'Ссылка должна быть валидным URL',
        min: 'Слишком маленький (',
        notOneOf: 'RSS уже существует',
        required: 'Не должно быть пустым',
        can_not_fetch: 'Ресурс не содержит валидный RSS',
        feed_loaded: 'RSS успешно загружен',
        network_error: 'Ошибка сети',
        watching: 'Просмотр',
      },
    },
    en: {
      translation: {
        default: 'Default field mistake',
        url: 'hello world',
        min: 'too small !!!',
        notOneOf: 'Must not be one of',
        required: 'Empty field',
        can_not_fetch: 'No rss by this url',
        feed_loaded: 'RSS successefully loaded',
        network_error: 'Network error',
        watching: 'Watch',
      },
    },
  },
});

setLocale({
  mixed: {
    default: () => ({ key: 'default' }),
    notOneOf: () => ({ key: 'notOneOf' }),
  },
  string: {
    url: () => ({ key: 'url' }),
    required: () => ({ key: 'required' }),
    min: ({ min }) => ({ key: 'min', values: { min } }),
  },
});

const validUrl = string().required().url();

const watchedState = view(state);
const watchedModalState = modalWatcher(state);

urlInput.addEventListener('input', (evt) => {
  watchedState.state = 'filling';
  watchedState.formValue = evt.target.value;
});

const axiosInstance = axios.create({
  baseURL,
});

const getFeed = (url) => axiosInstance
  .get(`get?url=${encodeURIComponent(url)}&disableCache=true`)
  .then((response) => {
    if (response.status === 200 && response?.data?.contents) {
      return { url, rss: response.data.contents };
    }
    throw new Error(i18next.t('network_error'));
  });

const updateFeeds = () => {
  const timer = setTimeout(() => {
    Promise
      .all(watchedState.feedList.map(({ link }) => getFeed(link)
        .then(({ url, rss }) => rssParser(
          rss,
          watchedState.feedList,
          watchedState.articles,
          url,
        ))))
      .then((feedObjects) => {
        const arrs = [];
        feedObjects.forEach(({ articlesList }) => {
          arrs.unshift(...articlesList);
        });
        if (arrs.length > 0) watchedState.articles.unshift(...arrs);
        updateFeeds();
      });
  }, fetchInterval);
  return timer;
};

queryForm.addEventListener('submit', (evt) => {
  evt.preventDefault();
  watchedState.state = 'processing';
  validUrl
    .notOneOf(watchedState.feedList.map(({ link }) => link))
    .validate(watchedState.formValue)
    .then(() => {
      watchedState.error = '';
      watchedState.validationState = 'valid';
    })
    .then(() => getFeed(state.queryProcess.formValue))
    .then(({ url, rss }) => {
      const result = rssParser(
        rss,
        watchedState.feedList,
        watchedState.articles,
        url,
      );
      console.log({ result });
      return result;
    })
    .then((feedObj) => {
      watchedState.feedList.unshift(...feedObj?.feedList);
      watchedState.articles.unshift(...feedObj?.articlesList);
      watchedState.state = 'success';
      if (!state.timer) state.timer = updateFeeds();
    })
    .catch((err) => {
      let errorText = '';
      if (err instanceof ValidationError) {
        errorText = i18next.t(err.type);
      } else if (err.isAxiosError) {
        errorText = i18next.t('network_error');
      } else {
        console.log({ err });
        errorText = err.message;
      }
      watchedState.state = 'failed';
      watchedState.error = errorText;
      watchedState.validationState = 'invalid';
    });
});

mainPart.addEventListener('click', (evt) => {
  if ((evt.target.tagName === 'A' || evt.target.tagName === 'BUTTON') && evt.target.hasAttribute('data-id')) {
    const [feedId, id] = evt.target.getAttribute('data-id').split('_');
    const index = watchedState.articles.reduce((acc, article, ind) => {
      const newAcc = (article.id === 1 * id && article.feedId === 1 * feedId) ? ind : acc;
      return newAcc;
    }, 0);
    watchedState.articles[index].visited = true;
  }
});

mainPart.addEventListener('click', (evt) => {
  if ((evt.target.tagName === 'BUTTON') && evt.target.hasAttribute('data-id')) {
    const [feedId, id] = evt.target.getAttribute('data-id').split('_');
    const index = watchedState.articles.reduce((acc, article, ind) => {
      const newAcc = (article.id === 1 * id && article.feedId === 1 * feedId) ? ind : acc;
      return newAcc;
    }, 0);
    watchedModalState.currentArticle = { ...watchedState.articles[index] };
  }
});
