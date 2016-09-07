












router.post("/messages/create/infer_conversation", (req, res) => {
  const userID = req.params.userID;
  const clientID = Number(req.params.clientID);
  const subject = "New Conversation";
  const content = req.body.content;
  const commID = req.body.commID;

  Conversations.getMostRecentConversation(userID, clientID)
  .then((conversation) => {
    // use existing conversation if exists and recent (5 days)
    var now, lastUpdated, recentOkay = false;
    if (conversation) {
      now = new Date().getTime() - (5 * 24 * 60 * 60 * 1000); // 5 days in past
      lastUpdated = new Date(conversation.updated).getTime();
      recentOkay = lastUpdated > now;
    }

    if (conversation && recentOkay) {
      Messages.sendOne(commID, content, conversation.convid)
      .then(() => {
        logClientActivity(req.params.clientID);
        logConversationActivity(conversation.convid);
        res.redirect(`${res.redirectUrlBase}/clients/client/${req.params.clientID}/messages`);
      }).catch(error_500(res));
    
    //otherwise create a new conversation
    } else {
      Conversations.create(userID, clientID, subject, true)
      .then((conversationID) => {
        return Messages.sendOne(commID, content, conversationID)
      }).then(() => {
        logClientActivity(req.params.clientID);
        res.redirect(`${res.redirectUrlBase}/clients/client/${req.params.clientID}/messages`);
      }).catch(error_500(res));
    }
  }).catch(error_500(res));
});


router.get("/conversations/create", (req, res) => {
  res.redirect(`${res.redirectUrlBase}/clients/address/${req.params.clientID}`);
});


router.get("/notifications", (req, res) => {
  res.redirect(`${res.redirectUrlBase}/clients/client/${req.params.clientID}/notifications/pending`);
});


router.get("/notifications/pending", (req, res) => {
  Notifications.findByClientID(req.params.clientID, false)
  .then((notifications) => {
    res.render("v4/primaryUser/client/notifications", {
      hub: {
        tab: "notifications",
        sel: "pending"
      },
      notifications: notifications
    });
  }).catch(error_500(res));
});


router.get("/notifications/sent", (req, res) => {
  Notifications.findByClientID(req.params.clientID, true)
  .then((notifications) => {
    res.render("v4/primaryUser/client/notifications", {
      hub: {
        tab: "notifications",
        sel: "sent"
      },
      notifications: notifications
    });
  }).catch(error_500(res));
});


router.get("/notifications/remove/:notificationID", (req, res) => {
  Notifications.removeOne(req.params.notificationID)
  .then(() => {
    req.flash("success", "Removed notification.");
    res.redirect(`${res.redirectUrlBase}/clients/client/${req.params.clientID}/notifications`);
  }).catch(error_500(res));
});


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



