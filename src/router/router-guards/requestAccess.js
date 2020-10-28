import store from '@/store';

export default async function (to, from, next) {
  if (store.state.user) {
    next({ name: 'Home' });
  } else {
    next();
  }
}
