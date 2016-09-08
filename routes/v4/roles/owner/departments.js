

// (Sub) router
let express         = require("express");
let router          = express.Router({mergeParams: true});


// Models
let modelsImport  = require("../../../../models/models");
let Client        = modelsImport.Client;
let Clients       = modelsImport.Clients;
let ColorTags     = modelsImport.ColorTags;
let Convo         = modelsImport.Convo;
let Users         = modelsImport.Users;
let Message       = modelsImport.Message;
let Messages      = modelsImport.Messages;
let Communication = modelsImport.Communication;
let Departments   = modelsImport.Departments;
let DepartmentSupervisors = modelsImport.DepartmentSupervisors;
let PhoneNumbers  = modelsImport.PhoneNumbers;


// General error handling
let errorHandling   = require("../../utilities/errorHandling");
let error500       = errorHandling.error500;



// ROUTES














router.get("/departments/deactivate/:departmentID", (req, res) => {
  Departments.findMembers(req.params.departmentID)
  .then((members) => {
    if (members.length == 0) {
      Departments.deactivate(req.params.departmentID)
      .then(() => {
        req.flash("success", "Deactivated department.");
        res.redirect( "/v4/users/" + 
                      req.user.cmid + 
                      "/owner/departments");
      }).catch(error500(res));
    } else {
      req.flash("warning", "Need to remove or close out members first.");
      res.redirect( "/v4/users/" + 
                    req.user.cmid + 
                    "/owner/departments");
    }
  }).catch(error500(res));
});

router.get("/departments/activate/:departmentID", (req, res) => {
  Departments.activate(req.params.departmentID)
  .then(() => {
    req.flash("success", "Activated department.");
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/owner/departments");
  }).catch(error500(res));
});




// EXPORT ROUTER OBJECt
module.exports = router;


