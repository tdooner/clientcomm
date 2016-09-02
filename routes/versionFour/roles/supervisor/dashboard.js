

// (Sub) router
var express         = require("express");
var router          = express.Router({mergeParams: true});


// Models
const modelsImport  = require("../../../../models/models");
const Users         = modelsImport.Users;
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

// Create base URL for this page
router.use((req, res, next) => {
  res.locals.parameters = req.params;
  req.redirectUrlBase = `/v4/orgs/${req.params.orgID}/users/${req.params.userID}/supervisor/department/${req.params.departmentID}/dashboard`;
  next();
});


// ROUTES

router.get("/", function (req, res) {
  res.redirect(`${req.redirectUrlBase}/overview`);
});

router.get("/overview", function (req, res) {
  var users, clients, countsByWeek, countsByDay;
  var orgID = Number(req.params.orgID);
  var departmentID = Number(req.params.departmentID);
  var userFilterID = Number(req.query.targetUserID);
  if (isNaN(userFilterID)) userFilterID = null;

  Departments.findByID(orgID, true)
  .then((dept) => {
    department = dept;
    return Users.findByDepartment(departmentID, true)
  }).then((usrs) => {
    users = usrs;
    return Clients.findByDepartment(departmentID, true);
  }).then((cls) => {
    clients = cls;
    if (userFilterID) {
      clients.filter(function(client) {
        return client.cm == userFilterID;
      });
    }

    if (userFilterID) return Messages.countsByUser(orgID, userFilterID, "day");
    else              return Messages.countsByDepartment(orgID, departmentID, "day");
  }).then((counts) => {
    countsByDay = counts;
    if (userFilterID) return Messages.countsByUser(orgID, userFilterID, "week");
    else              return Messages.countsByDepartment(orgID, departmentID, "week");
  }).then((counts) => {
    countsByWeek = counts;
    res.render("v4/supervisorUser/dashboards/organization", {
      hub: {
        tab: "dashboard",
        sel: null
      },
      department: department,
      users: users,
      userFilterID, userFilterID,
      clients: clients,
      countsByWeek: countsByWeek,
      countsByDay: countsByDay
    });
  }).catch(error_500(res));
});




// EXPORT ROUTER OBJECt
module.exports = router;


