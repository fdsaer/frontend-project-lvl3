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
        default_error: 'Ошибка заполнения поля',
        not_a_url: 'Это точно урл?',
        field_too_small: 'Слишком маленький (',
        not_one_of: 'Это уже было (',
        can_not_fetch: 'По этому урлу не содержится rss',
        feed_loaded: 'RSS успешно загружен',
      },
    },
    en: {
      translation: {
        default_error: 'Default field mistake',
        not_a_url: 'hello world',
        field_too_small: 'too small !!!',
        not_one_of: 'Must not be one of',
        can_not_fetch: 'No rss by this url',
        feed_loaded: 'RSS successefully loaded',
      },
    },
  },
});

setLocale({
  mixed: {
    default: () => ({ key: 'default_error' }),
    notOneOf: () => ({ key: 'not_one_of' }),
  },
  string: {
    url: () => ({ key: 'not_a_url' }),
    min: ({ min }) => ({ key: 'field_too_small', values: { min } }),
  },
});

const validUrl = string().min(3).url();

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
// get?url=https%3A%2F%2Faif.ru%2Frss%2Fhealth.php&disableCache=true
  .then((response) => {
    if (response.status === 200 && response?.data?.contents) {
      return { url, rss: response.data.contents };
    }
    throw new Error(i18next.t('can_not_fetch'));
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
        const [errorMessage] = err.errors.map((item) => i18next.t(item.key));
        errorText = errorMessage;
      } else {
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
