const path = require('path');
const fs = require('fs');
const axios = require('axios'); // eslint-disable-line
const dataDir = require('data-dir'); // eslint-disable-line

const { emulators } = require('../../firebase.json');
const { region } = require('../../functions/config');

const { projects } = JSON.parse(fs.readFileSync(path.join(__dirname, '../../.firebaserc'), 'utf8'));

// Emulator settings for functions
const PORT = emulators.functions.port;
const PROJECT_ID = projects.development;
const REGION = region;
const FUNCTION_ID = 'populateFirestoreEmulator';
const SECRET = 'UZPmJ9gOXHmb6RRttAyURi4JdkvDq8'; // todo: read from environment variable
const url = `http://localhost:${PORT}/${PROJECT_ID}/${REGION}/${FUNCTION_ID}?secret=${SECRET}`;

run();

async function run() {
  const users = require('./users/mockUsers.json');

  const rawData = dataDir(path.join(__dirname, 'orgs'));
  const orgs = Object.values(rawData).map(parseOrgData);

  callCloudFunction({ users, orgs });
}

function parseOrgData(org) {
  return {
    ...org.data,
    periods: parseObjectivesData(org.objectives),
    departments: org.departments ? Object.values(org.departments).map(parseDepartmentData) : [],
  };
}

function parseDepartmentData(dept) {
  return {
    ...dept.data,
    periods: parseObjectivesData(dept.objectives),
    products: dept.products ? Object.values(dept.products).map(parseProductData) : [],
  };
}

function parseProductData(product) {
  return {
    ...product.data,
    periods: parseObjectivesData(product.objectives),
  };
}

function parseObjectivesData(list) {
  Object.keys(list)
    .map(key => {
      key.key = key;
      return key;
    })
    .filter(key => key.split('_').length === 1)
    .forEach(key => {
      list[key].objectives = [];
    });

  Object.keys(list)
    .filter(key => key.split('_').length === 2)
    .forEach(key => {
      list[key].keyResults = [];
      const period = key.split('_')[0];
      list[period].objectives.push(list[key]);
    });

  Object.keys(list)
    .filter(key => key.split('_').length === 3)
    .forEach(key => {
      const [period, objective] = key.split('_');
      list[`${period}_${objective}`].keyResults.push(list[key]);
    });

  return Object.keys(list)
    .filter(key => key.split('_').length === 1)
    .map(key => list[key]);
}

function callCloudFunction(data) {
  return axios({
    method: 'post',
    url,
    data,
  }).catch(err => {
    throw new Error(err);
  });
}
