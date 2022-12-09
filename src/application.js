import { setLocale, string, ValidationError } from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import onChange from 'on-change';
import ParseError from './parseError.js';
import { modalWatcher, uiWatcher, queryWatcher } from './view.js';
import { baseURL, fetchInterval } from './constants.js';
import {
  parseRss, getFeed, updateFeeds, getNewFeedsWithIds,
} from './utilities.js';

export default () => {
  const getDomElements = () => {
    const mainPart = document.querySelector('main');
    const queryForm = mainPart.querySelector('.rss-form');
    const modal = document.getElementById('modal');
    return {
      mainPart,
      form: {
        queryForm,
        urlInput: document.getElementById('url-input'),
        feedbackString: mainPart.querySelector('.feedback'),
        addButton: queryForm.querySelector('button'),
      },
      content: {
        feeds: mainPart.querySelector('.feeds'),
        posts: mainPart.querySelector('.posts'),
      },
      modal: {
        modal,
        modalTitle: modal.querySelector('.modal-title'),
        modalBody: modal.querySelector('.modal-body'),
        modalLinkButton: modal.querySelector('.modal-footer a'),
      },
    };
  };

  const domElements = getDomElements();
  const { content: { posts: postsDomEl } } = domElements;
  const { form: { urlInput: urlInputDomEl, queryForm: formDomEl } } = domElements;
  const { modal: modalDomEl } = domElements;

  const state = {
    queryProcess: {
      state: 'filling',
      formValue: '',
      error: '',
      validationState: 'valid',
      feedList: [],
      articles: [],
    },
    uiState: {
      visitedArticles: [],
      currentArticle: {},
    },
    timer: '',
  };

  const i18instance = i18next.createInstance();
  i18instance.init({
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
          parse_error: 'Ресурс не содержит валидный RSS',
          feed_loaded: 'RSS успешно загружен',
          network_error: 'Ошибка сети',
          watching: 'Просмотр',
          posts: 'Посты',
          feeds: 'Фиды',
        },
      },
      en: {
        translation: {
          default: 'Default field mistake',
          url: 'hello world',
          min: 'too small !!!',
          notOneOf: 'Must not be one of',
          required: 'Empty field',
          parse_error: 'No rss by this url',
          feed_loaded: 'RSS successefully loaded',
          network_error: 'Network error',
          watching: 'Watch',
          posts: 'Posts',
          feeds: 'Feeds',
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
  const watchedState = queryWatcher(onChange, state, domElements, i18instance.t);
  const watchedModalState = modalWatcher(onChange, state, modalDomEl);
  const watchedUiState = uiWatcher(onChange, state, domElements, i18instance.t);
  const axiosInstance = axios.create({
    baseURL,
  });

  urlInputDomEl.addEventListener('input', (evt) => {
    watchedState.state = 'filling';
    watchedState.formValue = evt.target.value;
  });

  formDomEl.addEventListener('submit', (evt) => {
    evt.preventDefault();
    watchedState.state = 'processing';
    validUrl
      .notOneOf(watchedState.feedList.map(({ link }) => link))
      .validate(watchedState.formValue)
      .then(() => {
        watchedState.error = '';
        watchedState.validationState = 'valid';
      })
      .then(() => getFeed(state.queryProcess.formValue, axiosInstance))
      .then(({ url, rss }) => parseRss(rss, url))
      .then((fetchedFeeds) => (
        getNewFeedsWithIds(fetchedFeeds, watchedState.feedList, watchedState.articles)))
      .then(({ feedList, articlesList }) => {
        watchedState.feedList.unshift(...feedList);
        watchedState.articles.unshift(...articlesList);
        watchedState.state = 'success';
      })
      .then(() => {
        if (!state.timer) {
          state.timer = updateFeeds(
            watchedState,
            getFeed,
            parseRss,
            axiosInstance,
            fetchInterval,
          );
        }
      })
      .catch((err) => {
        let errorText = '';
        if (err instanceof ValidationError) {
          errorText = i18instance.t(err.type);
        } else if (err instanceof ParseError) {
          errorText = i18instance.t('parse_error');
        } else if (err.isAxiosError) {
          errorText = i18instance.t('network_error');
        } else {
          console.log({ err });
          errorText = err.message;
        }
        watchedState.state = 'failed';
        watchedState.error = errorText;
        watchedState.validationState = 'invalid';
      });
  });

  postsDomEl.addEventListener('click', (evt) => {
    if ((evt.target.tagName === 'A' || evt.target.tagName === 'BUTTON') && evt.target.hasAttribute('data-id')) {
      const currentId = evt.target.getAttribute('data-id');
      watchedUiState.push(currentId);
      if (evt.target.tagName === 'BUTTON') {
        watchedModalState.id = currentId;
      }
    }
  });
};
