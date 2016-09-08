const colors = require('colors')

module.exports = {

  error500: function (res) { 
    // In the future, note that this could cause a performance issue if product on non-human actions
    return function (err) {
      // Clean up error if one is provided
      if (typeof err !== "undefined") {

        // Log the error if passed in
        console.log(`\n Error occured. \n Timestamp: ${new Date()}`.yellow);
        console.log(err.stack);
        console.log("--- \n");

      // If there is no error, provide a generic phrase
      } else {
        stringErr = "Internal Error 500 Something happened.";
      }

      // Produce a response to the client
      res.set({'content-type':'text/plain'}).status(500).send(err.stack)

    }
  },
  notFound: (res) => {
    res.status(404).render('v4/general/404')
  } 

}

