

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
let error_500       = errorHandling.error_500;



// ROUTES

router.get("/departments/", (req, res) => {
  res.redirect( "/v4/users/" + 
                req.user.cmid + 
                "/owner/departments/filter/active");
});

router.get("/departments/filter/:activeStatus", (req, res) => {
  let activeStatus;
  if (req.params.activeStatus == "active") {
    activeStatus = true;
  } else { 
    activeStatus = false;
  }

  Departments.selectByOrgID(req.user.org, activeStatus)
  .then((departments) => {
    res.render("v4/owner/departments/departments", {
      hub: {
        tab: "departments",
        sel: activeStatus ? "active" : "inactive"
      },
      departments: departments
    });
  }).catch(error_500(res));
});

router.get("/departments/create", (req, res) => {
  PhoneNumbers.findByOrgID(req.user.org)
  .then((phoneNumbers) => {
    res.render("v4/owner/departments/create", {
      phoneNumbers: phoneNumbers
    });
  }).catch(error_500(res));
});

router.post("/departments/create", (req, res) => {
  Departments.createOne(req.user.org, req.body.name, req.body.phoneNumber, req.user.cmid)
  .then(() => {
    req.flash("success", "Made new department.");
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/owner/departments");
  }).catch(error_500(res));
});

router.get("/departments/edit/:departmentID", (req, res) => {
  Departments.findByID(req.params.departmentID)
  .then((department) => {
    if (department) {
      PhoneNumbers.findByOrgID(req.user.org)
      .then((phoneNumbers) => {
        res.render("v4/owner/departments/edit", {
          department: department,
          phoneNumbers: phoneNumbers
        });
      }).catch(error_500(res));
    } else {
      res.redirect("/404")
    }
  }).catch(error_500(res));
});

router.post("/departments/edit/:departmentID", (req, res) => {
  let departmentID = req.params.departmentID;
  let name = req.body.name;
  let phoneNumber = req.body.phoneNumber;
  Departments.editOne(departmentID, name, phoneNumber)
  .then(() => {
    req.flash("success", "Updated department.");
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/owner/departments");
  }).catch(error_500(res));
});

router.get("/departments/edit/:departmentID/supervisors", (req, res) => {
  let supervisors;
  let departmentID = req.params.departmentID;
  DepartmentSupervisors.findByDepartmentIDs(req.params.departmentID)
  .then((supers) => {
    supervisors = supers;
    return Users.findByOrg(req.user.org)
  }).then((users) => {
    // limit only to same department
    let members = users.filter(function (user) {
      return user.department == departmentID;
    });

    res.render("v4/owner/departments/editSupervisors", {
      supervisors: supervisors,
      members: members,
      parameters: req.params
    });
  }).catch(error_500(res));
});

router.post("/departments/edit/:departmentID/supervisors", (req, res) => {
  let revertClass = req.body.revertClass;
  let departmentID = req.params.departmentID;
  let supervisorIDs = req.body.supervisorIDs;
  if (!Array.isArray(supervisorIDs)) supervisorIDs = [req.body.supervisorIDs];
  DepartmentSupervisors.updateSupervisors(departmentID, supervisorIDs, revertClass)
  .then(() => {
    req.flash("success", "Updated department supervisors.");
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/owner/departments");
  }).catch(error_500(res));
});

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
      }).catch(error_500(res));
    } else {
      req.flash("warning", "Need to remove or close out members first.");
      res.redirect( "/v4/users/" + 
                    req.user.cmid + 
                    "/owner/departments");
    }
  }).catch(error_500(res));
});

router.get("/departments/activate/:departmentID", (req, res) => {
  Departments.activate(req.params.departmentID)
  .then(() => {
    req.flash("success", "Activated department.");
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/owner/departments");
  }).catch(error_500(res));
});




// EXPORT ROUTER OBJECt
module.exports = router;


