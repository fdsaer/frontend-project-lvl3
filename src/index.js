import './style.scss';
import * as yup from 'yup';
import view from './view.js';

const queryForm = document.querySelector('.rss-form');
const urlInput = document.getElementById('url-input');

const schema = yup.object().shape({
  url: yup.string().url(),
});

const state = {
  queryProcess: {
    state: 'filling',
    formValue: '',
    errors: [],
    validationState: 'valid',
    feedList: [],
  },
};

const isDouble = (arr, value) => arr.includes(value);
const watchesState = view(state);

urlInput.addEventListener('input', (evt) => {
  watchesState.state = 'filling';
  watchesState.formValue = evt.target.value;
});

queryForm.addEventListener('submit', (evt) => {
  evt.preventDefault();
  watchesState.state = 'processing';
  schema
    .validate({ url: watchesState.formValue }, { abortEarly: false })
    .then(() => {
      if (isDouble(watchesState.feedList, watchesState.formValue)) {
        throw new Error('Такой адрес уже существует');
      } else {
        watchesState.state = 'processed';
        watchesState.errors = [];
        watchesState.validationState = 'valid';
        watchesState.feedList.push(state.queryProcess.formValue);
      }
    })
    .catch((e) => {
      watchesState.state = 'failed';
      watchesState.errors.push(e.message);
      watchesState.validationState = 'invalid';
      console.log(e.message);
    });
});
