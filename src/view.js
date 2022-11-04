import './style.scss';
import onChange from 'on-change';

// const queryForm = document.querySelector('.rss-form');
const urlInput = document.getElementById('url-input');
const feedbackString = document.querySelector('.feedback');

export default (state) => {
  console.log('initialing onChange');
  console.log({ state });
  const watchedState = onChange(state.queryProcess, () => {
    console.log('i am in watcher');
    console.log({ currentState: watchedState });
    if (watchedState.validationState === 'invalid') {
      console.log('i am here');
      urlInput.classList.add('is-invalid');
      feedbackString.textContent = watchedState.error;
    } else {
      urlInput.classList.remove('is-invalid');
      feedbackString.textContent = '';
    }
  });
  return watchedState;
};
