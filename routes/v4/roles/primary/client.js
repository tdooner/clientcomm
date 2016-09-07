


router.get("/edit", (req, res) => {
  res.render("v4/primaryUser/client/edit");
});


router.post("/edit", (req, res) => {
  const clientID = req.params.clientID;
  const first = req.body.first;
  const middle = req.body.middle;
  const last = req.body.last;
  const dob = req.body.dob;
  const uniqueID1 = req.body.uniqueID1;
  const uniqueID2 = req.body.uniqueID2;
  Client.editOne(clientID, first, middle, last, dob, uniqueID1, uniqueID2)
  .then(() => {
    logClientActivity(req.params.clientID);
    req.flash("success", "Edited client.");
    res.redirect(`${res.redirectUrlBase}/clients/client/${clientID}`);
  }).catch(error_500(res));
});


router.get("/editcolortag", (req, res) => {
  ColorTags.selectAllByUser(req.params.userID)
  .then((colorTags) => {
    if (colorTags.length > 0) {
      res.render("v4/primaryUser/client/selectcolor", {
        colorTags: colorTags,
      });
    } else {
      res.redirect(`${res.redirectUrlBase}/colortags`);
    }
  }).catch(error_500(res));
});


router.post("/editcolortag", (req, res) => {
  var colorTagID = req.body.colorTagID;
  if (colorTagID == "") colorTagID = null
  Client.udpateColorTag(req.params.clientID, colorTagID)
  .then(() => {
    logClientActivity(req.params.clientID);
    req.flash("success", "Changed client color.");
    res.redirect(`${res.redirectUrlBase}/clients/open`);
  }).catch(error_500(res));
});


router.get("/transfer", (req, res) => {
  var user;
  Users.findByID(req.params.userID)
  .then((u) => {
    user = u;
    return Users.findByOrg(req.params.orgID)
  }).then((users) => {

    // limit only to same department transfers
    users = users.filter((user) {
      return user.department == user.department;
    });

    res.render("v4/primaryUser/client/transfer", {
      users: users,
      parameters: req.params
    });
  }).catch(error_500(res));
});


router.post("/transfer", (req, res) => {
  const fromUserID = req.params.userID;
  const toUserID = Number(req.body.userID);
  const clientID = Number(req.params.clientID);
  const bundleConversations = req.params.bundleConversations ? true : false;
  Users.findByID(toUserID)
  .then((user) => {
    if (user && user.active) {
      Client.transfer(clientID, fromUserID, toUserID, bundleConversations)
      .then(() => {
        logClientActivity(req.params.clientID);
        res.redirect(`${res.redirectUrlBase}/clients/open`);
      }).catch(error_500(res));
    } else {
      res.redirect("/404");
    }
  }).catch(error_500(res));
});


router.get("/messages", (req, res) => {
  res.redirect(`${res.redirectUrlBase}/clients/client/${req.params.clientID}/messages/filter/all`);
});

router.get("/messages/filter/:method", (req, res) => {
  var methodFilter = "all";
  if (req.params.method == "texts") methodFilter = "cell";

  var conversationFilterID = Number(req.query.conversation);
  if (isNaN(conversationFilterID)) conversationFilterID = null;

  var conversations, messages;
  Conversations.findByUserAndClient(req.params.userID, req.params.clientID)
  .then((convos) => {
    conversations = convos;
    return Messages.findByClientID(req.params.userID, req.params.clientID)
  }).then((msgs) => {
    messages = msgs.filter((msg) {
      if (msg.comm_type == methodFilter || methodFilter == "all") {
        if (msg.convo == conversationFilterID || conversationFilterID == null) {
          return true;
        } else { return false; }
      } else { return false; }
    });
    return CommConns.findByClientID(req.params.clientID)
  }).then((communications) => {
    res.render("v4/primaryUser/client/messages", {
      hub: {
        tab: "messages",
        sel: req.params.method
      },
      conversations: conversations,
      messages: messages,
      communications: communications,
      conversationFilterID: conversationFilterID
    });
  }).catch(error_500(res));
});


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


