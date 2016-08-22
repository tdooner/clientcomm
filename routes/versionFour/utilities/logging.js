const modelsImport   = require("../../../models/models");
const Client = modelsImport.Client;

module.exports = {

  logClientActivity: function (clientID) {
    Client.logActivity(clientID).then(() => { }).catch(() => { });
  }

}

