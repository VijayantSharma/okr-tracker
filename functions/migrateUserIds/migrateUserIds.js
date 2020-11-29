const functions = require('firebase-functions');
const admin = require('firebase-admin');

const config = require('../config');

const db = admin.firestore();

const from = '@byr.oslo.kommune.no';
const to = '@origo.oslo.kommune.no';

exports.migrateUserIds = functions.region(config.region).https.onCall(migrateUserIds);

async function migrateUserIds() {
  try {
    await replaceUserDocuments();
    await replaceTeams();
    await processPeriods();
    await processOrganizations();
    await processObjectives();
    await processKeyResults();
    await processDepartments();
    await processAudit();
    //await processKpis();
    return true;
  } catch (err) {
    console.log(err);
    throw new functions.https.HttpsError('cancelled', err.message);
  }
}

async function replaceUserDocuments() {
  const users = db.collection('users');
  const userRefs = await users.get().then(({ docs }) => docs);

  const userData = userRefs.map(doc => ({
    ...doc.data(),
    id: doc.id.replace(from, to),
    email: doc.id.replace(from, to),
  }));

  await Promise.all(userRefs.map(({ ref }) => ref.delete()));

  userData.forEach(obj => {
    users.doc(obj.id).set(obj);
  });

  return true;
}

async function replaceTeams() {
  const users = db.collection('users');
  const products = db.collection('products');
  const productRefs = await products.get().then(({ docs }) => docs);

  if (!productRefs.length) return true;

  return Promise.all(
    productRefs.map(async doc => {
      const { team } = doc.data();
      const teamRef = team.map(({ id }) => users.doc(id.replace(from, to))) || [];

      await replaceCreatedAndEdited(doc, users);
      return doc.ref.update({ team: teamRef });
    })
  );
}

async function processAudit() {
  const audit = db.collection('audit');

  const documents = await audit.get().then(({ docs }) => docs);

  if (!documents.length) return true;

  try {
    documents.forEach(doc => {
      const { user } = doc.data();

      let newUser;
      if (user.id) {
        newUser = user.id.replace(from, to);
      } else {
        newUser = user.replace(from, to);
      }
      doc.ref.update({
        user: newUser,
      });
    });
  } catch (e) {
    console.log(e);
  }

  return true;
}

async function processDepartments() {
  const users = db.collection('users');
  const departments = db.collection('departments');
  const departmentRefs = await departments.get().then(({ docs }) => docs);

  if (!departmentRefs.length) return true;

  return Promise.all(
    departmentRefs.map(doc => {
      return replaceCreatedAndEdited(doc, users);
    })
  );
}

async function processKeyResults() {
  const users = db.collection('users');
  const keyResults = db.collection('keyResults');
  const keyResultsRefs = await keyResults.get().then(({ docs }) => docs);

  if (!keyResultsRefs.length) return true;

  return Promise.all(
    keyResultsRefs.map(doc => {
      return replaceCreatedAndEdited(doc, users);
    })
  );
}

async function processKpis() {
  const users = db.collection('users');
  const kpis = db.collection('kpis');
  const kpisRefs = await kpis.get().then(({ docs }) => docs);

  if (!kpisRefs.length) return true;

  return Promise.all(
    kpisRefs.map(doc => {
      return replaceCreatedAndEdited(doc, users);
    })
  );
}

async function processObjectives() {
  const users = db.collection('users');
  const objectives = db.collection('objectives');
  const objectivesRefs = await objectives.get().then(({ docs }) => docs);

  if (!objectivesRefs.length) return true;

  return Promise.all(
    objectivesRefs.map(doc => {
      return replaceCreatedAndEdited(doc, users);
    })
  );
}

async function processOrganizations() {
  const users = db.collection('users');
  const organizations = db.collection('organizations');
  const organizationsRefs = await organizations.get().then(({ docs }) => docs);

  if (!organizationsRefs.length) return true;

  return Promise.all(
    organizationsRefs.map(doc => {
      return replaceCreatedAndEdited(doc, users);
    })
  );
}

async function processPeriods() {
  const users = db.collection('users');
  const periods = db.collection('periods');
  const periodsRefs = await periods.get().then(({ docs }) => docs);

  if (!periodsRefs.length) return true;

  return Promise.all(
    periodsRefs.map(doc => {
      return replaceCreatedAndEdited(doc, users);
    })
  );
}

async function replaceCreatedAndEdited(doc, users) {
  const { editedBy, createdBy } = doc.data();

  if (createdBy && createdBy.id) {
    const userRef = users.doc(createdBy.id.replace(from, to));
    doc.ref.update({ createdBy: userRef });
  }

  if (editedBy && editedBy.id) {
    const userRef = users.doc(editedBy.id.replace(from, to));
    doc.ref.update({ editedBy: userRef });
  }

  return true;
}
