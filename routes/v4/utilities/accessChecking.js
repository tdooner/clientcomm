module.exports = {

  confirmMatch: function (type, compareArray) { 
    if (!compareArray.length) {
      return true;
    } else {
      var typesOkay = true;
      compareArray.forEach(function (ea) {
        if (typeof ea !== type) typesOkay = false;
      });
      if (typesOkay) {
        return compareArray
                .reduce(function (a, b) {
                  return (a === b) ? a : (!b);
                }) === compareArray[0];
      } else {
        return false;
      }
    }
  }

}

