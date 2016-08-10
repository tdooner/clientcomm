'use strict';

// Libraries
const db      = require("../server/db");
const Promise = require("bluebird");


function undefinedValuesCheck (array) {
  var undefinedExists = false;

  array.forEach(function (ea) {
    if (typeof ea == "undefined") undefinedExists = true;
  });

  return undefinedExists;
}

module.exports = {
  undefinedValuesCheck: undefinedValuesCheck
}