

// (Sub) router
var express         = require("express");
var router          = express.Router({mergeParams: true});


// Models
const modelsImport  = require("../../../../models/models");
const Groups        = modelsImport.Groups;


// General error handling
var errorHandling   = require("../../utilities/errorHandling");
var error_500       = errorHandling.error_500;


// Access utilities
var accessChecking  = require("../../utilities/accessChecking");
var confirmMatch    = accessChecking.confirmMatch;


// GENERAL CHECK
router.get("/", function (req, res) {
  Groups.findByUser(Number(req.params.userID))
  .then((groups) => {
    res.render("v4/primaryUser/groups/groups", {
      hub: {
        tab: "groups",
        sel: null
      },
      groups: groups
    });
  }).catch(error_500(res));
});

// EXPORT ROUTER OBJECt
module.exports = router;


