require('dotenv').config();

module.exports = {
  currentMode: process.env.MODE || 'DEV',
  outputRep: process.env.OUTPUT || '_site'
};