'use strict';


module.exports = {
  Client:         require("./classes/client"), 
  Clients:        require("./classes/clients"), 
  Templates:      require("./classes/templates"),
  Notifications:  require("./classes/notifications"), 
  Groups:         require("./classes/groups"), 
  Message:        require("./classes/message"), 
  Messages:       require("./classes/messages"), 
  Conversations:  require("./classes/conversations"),
  CommConns:      require("./classes/commConns"), 
  ColorTags:      require("./classes/colorTags"), 
  Communication:  require("./classes/communication"),
  Group:          require("./classes/group"),

  // Remove the below eventually
  Convo:         require("./classes/conversation"),
}