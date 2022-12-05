import './style.scss';
import { setLocale, string, ValidationError } from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import view from './view.js';
import { baseURL } from './constants.js';
import { rssParser } from './utilities.js';

const queryForm = document.querySelector('.rss-form');
const urlInput = document.getElementById('url-input');

const state = {
  queryProcess: {
    state: 'filling',
    formValue: '',
    error: '',
    validationState: 'valid',
    feedList: [],
    articles: [],
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
      },
    },
    en: {
      translation: {
        default_error: 'Default field mistake',
        not_a_url: 'hello world',
        field_too_small: 'too small !!!',
        not_one_of: 'Must not be one of',
        can_not_fetch: 'No rss by this url',
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

urlInput.addEventListener('input', (evt) => {
  watchedState.state = 'filling';
  watchedState.formValue = evt.target.value;
});

const axiosInstance = axios.create({
  baseURL,
});

const getFeed = (url) => axiosInstance
  .get(`get?url=${encodeURIComponent(url)}`)
  .then((response) => {
    if (response.status === 200 && response?.data?.contents) {
      return response.data.contents;
    }
    throw new Error(i18next.t('can_not_fetch'));
  });

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
    .then((rss) => {
      const result = rssParser(
        rss,
        watchedState.feedList.length > 0 ? watchedState.feedList.map(({ id }) => id) : [],
      );
      console.log({ result });
      return result;
    })
    .then((feedObj) => {
      watchedState.feedList.unshift(...feedObj?.feedList);
      watchedState.articles.unshift(...feedObj?.articlesList);
      watchedState.state = 'success';
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
