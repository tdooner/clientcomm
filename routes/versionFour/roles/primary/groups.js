

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
  Templates.findByUser(Number(req.params.userID))
  .then((templates) => {
    res.render("v4/primaryUser/templates/templates", {
      hub: {
        tab: "templates",
        sel: null
      },
      templates: templates
    });
  }).catch(error_500(res));
});

// EXPORT ROUTER OBJECt
module.exports = router;


