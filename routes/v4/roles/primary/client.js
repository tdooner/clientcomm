






router.get("/notifications/create", (req, res) => {
  res.redirect(`${res.redirectUrlBase}/notifications/create/sendto`);
});


router.get("/communications", (req, res) => {
  res.redirect(`${res.redirectUrlBase}/clients/client/${req.params.clientID}/communications/filter/open`);
});


router.get("/communications/filter/open", (req, res) => {
  CommConns.getClientCommunications(req.params.clientID)
  .then((communications) => {
    res.render("v4/primaryUser/client/communications", {
      hub: {
        tab: "contactMethods",
        sel: null
      },
      communications: communications
    });
  }).catch(error_500(res));
});


router.get("/communications/remove/:communicationID", (req, res) => {
  CommConns.findByClientID(req.params.clientID)
  .then((commConns) => {
    if (commConns.length > 1) {
      Communications.removeOne(req.params.communicationID)
      .then((communications) => {
        req.flash("success", "Removed communication method.");
        res.redirect(`${res.redirectUrlBase}/clients/client/${req.params.clientID}/communications`);
      }).catch(error_500(res));
    } else {
      req.flash("warning", "Can't remove the only remaining communication method.");
      res.redirect(`${res.redirectUrlBase}/clients/client/${req.params.clientID}/communications`);
    }
  })
});


router.get("/communications/create", (req, res) => {
  res.render("v4/primaryUser/client/createComm", {
    commConn: {}
  });
});


router.post("/communications/create", (req, res) => {
  const clientID = req.params.clientID;
  const name = req.body.description;
  const type = req.body.type;
  var   value = req.body.value;

  // clean up numbers
  if (type == "cell" || type == "landline") {
    value = value.replace(/[^0-9.]/g, "");
    if (value.length == 10) { value = "1" + value; }
  }
  CommConns.createOne(clientID, type, name, value)
  .then(() => {
    req.flash("success", "Created new communication method.");
    res.redirect(`${res.redirectUrlBase}/clients/client/${req.params.clientID}/communications`);
  }).catch(error_500(res));
});


// EXPORT ROUTER OBJECt
module.exports = router;



