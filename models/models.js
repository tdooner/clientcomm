'use strict';


module.exports = { 
  Users:          require("./classes/users"), 
  Clients:        require("./classes/clients"), 
  Templates:      require("./classes/templates"),
  Notifications:  require("./classes/notifications"), 
  Groups:         require("./classes/groups"), 
  Messages:       require("./classes/messages"), 
  Conversations:  require("./classes/conversations"),
  CommConns:      require("./classes/commConns"), 
  ColorTags:      require("./classes/colorTags"), 
  Communications:  require("./classes/communications"),

  // Remove the below eventually
  Convo:         require("./classes/conversation"),
  Communication:  require("./classes/communication"),
  Group:          require("./classes/group"),
  Client:         require("./classes/client"),
  Message:        require("./classes/message"), 
}