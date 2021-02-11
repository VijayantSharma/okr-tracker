import { db } from '@/config/firebaseConfig';
import props from './props';
import { validateCreateProps, createDocument, validateUpdateProps, updateDocument, deleteDocument } from '../common';

const collection = db.collection('keyResults');

const create = (data) => {
  if (!validateCreateProps(props, data)) {
    throw new Error('Invalid data');
  }
  data.progression = 0;
  return createDocument(collection, data);
};

const update = async (id, data) => {
  validateUpdateProps(props, data);
  return updateDocument(collection.doc(id), data);
};

const archive = (id) => update(id, { archived: true });
const restore = (id) => update(id, { archived: false });

const deleteDeep = async (id) => {
  // Delete affected progress
  collection
    .doc(id)
    .collection('progress')
    .get()
    .then(({ docs }) => docs.forEach(({ ref }) => ref.delete()));

  return deleteDocument(update, collection.doc(id));
};

export default { create, update, archive, restore, deleteDeep };
