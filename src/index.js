import './style.scss';
import { setLocale, string } from 'yup';
import i18next from 'i18next';
import view from './view.js';

const queryForm = document.querySelector('.rss-form');
const urlInput = document.getElementById('url-input');

const state = {
  queryProcess: {
    state: 'filling',
    formValue: '',
    error: '',
    validationState: 'valid',
    feedList: [],
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
      },
    },
    en: {
      translation: {
        default_error: 'Default field mistake',
        not_a_url: 'hello world',
        field_too_small: 'too small !!!',
        not_one_of: 'Must not be one of',
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

queryForm.addEventListener('submit', (evt) => {
  evt.preventDefault();
  watchedState.state = 'processing';
  validUrl
    .notOneOf(watchedState.feedList)
    .validate(watchedState.formValue)
    .then(() => {
      watchedState.state = 'processed';
      watchedState.error = '';
      watchedState.validationState = 'valid';
      watchedState.feedList.push(state.queryProcess.formValue);
    })
    .catch((err) => {
      const [errorMessage] = err.errors.map((item) => i18next.t(item.key));
      watchedState.state = 'failed';
      watchedState.error = errorMessage;
      watchedState.validationState = 'invalid';
    });
});
