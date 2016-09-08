

// (Sub) router
let express         = require("express");
let router          = express.Router({mergeParams: true});


// Models
let modelsImport  = require("../../../../models/models");
let Client        = modelsImport.Client;
let Clients       = modelsImport.Clients;
let ColorTags     = modelsImport.ColorTags;
let Convo         = modelsImport.Convo;
let Message       = modelsImport.Message;
let Messages      = modelsImport.Messages;
let Departments   = modelsImport.Departments;


// General error handling
let errorHandling   = require("../../utilities/errorHandling");
let error500       = errorHandling.error500;



// ROUTES

router.get("/dashboard/", (req, res) => {
  res.redirect( "/v4/users/" + 
                req.user.cmid + 
                "/owner/dashboard/overview");
});

router.get("/dashboard/overview", (req, res) => {
  let departments, countsByWeek, countsByDay;
  let departmentFilterID = Number(req.query.departmentID);
  if (isNaN(departmentFilterID)) departmentFilterID = null;

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
    res.render("v4/owner/dashboards/organization", {
      hub: {
        tab: "dashboard",
        sel: null
      },
      departments: departments,
      departmentFilterID: departmentFilterID,
      countsByWeek: countsByWeek,
      countsByDay: countsByDay
    });
  }).catch(error500(res));
});




// EXPORT ROUTER OBJECt
module.exports = router;


