

// (Sub) router
var express         = require("express");
var router          = express.Router({mergeParams: true});


// Models
const modelsImport  = require("../../../../models/models");
const Client        = modelsImport.Client;
const Clients       = modelsImport.Clients;
const ColorTags     = modelsImport.ColorTags;
const Convo         = modelsImport.Convo;
const Message       = modelsImport.Message;
const Messages      = modelsImport.Messages;
const Departments   = modelsImport.Departments;


// General error handling
var errorHandling   = require("../../utilities/errorHandling");
var error_500       = errorHandling.error_500;



// ROUTES

router.get("/", function (req, res) {
  res.redirect( "/v4/users/" + 
                req.user.cmid + 
                "/supervisor/dashboard/overview");
});

router.get("/overview", function (req, res) {
  var departments, countsByWeek, countsByDay;
  var departmentFilterID = Number(req.query.departmentID);
  if (isNaN(departmentFilterID)) departmentFilterID = req.user.department;

  Departments.selectByOrgID(req.user.org, true)
  .then((depts) => {
    departments = depts;

    if (departmentFilterID) {
      return Messages.countsByDepartment(req.user.org, departmentFilterID, "day")
    } else {
      return Messages.countsByOrg(req.user.org, "day")
    }
  }).then((counts) => {
    countsByDay = counts;

    if (departmentFilterID) {
      return Messages.countsByDepartment(req.user.org, departmentFilterID, "week")
    } else {
      return Messages.countsByOrg(req.user.org, "week")
    }
  }).then((counts) => {
    countsByWeek = counts;
    res.render("v4/supervisorUser/dashboards/organization", {
      hub: {
        tab: "dashboard",
        sel: null
      },
      departments: departments,
      departmentFilterID: departmentFilterID,
      countsByWeek: countsByWeek,
      countsByDay: countsByDay
    });
  }).catch(error_500(res));
});




// EXPORT ROUTER OBJECt
module.exports = router;


