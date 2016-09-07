module.exports = {

  error_500: function (res) { 
    // In the future, note that this could cause a performance issue if product on non-human actions
    return function (err) {

      // Clean up error if one is provided
      if (typeof err !== "undefined") {
        // Convert the error to a string in case it is an object
        err = JSON.stringify(err);
        // Log the error if passed in
        console.log("\n Error occured. \n Timestamp: " + new Date());
        console.log(err);
        console.log("--- \n");

      // If there is no error, provide a generic phrase
      } else {
        err = "Internal Error 500 Something happened.";
      }

      // Produce a response to the client
      res.status(500).send(String(err))
    }
  },
  notFound: (res) => {
    res.status(404).send('v4/general/404')
  } 

}

