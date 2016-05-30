


// DEPENDENCIES
var db = require("../server/db");
var assert = require("chai").assert;
var creds = require("../credentials");
var u = require("./utils");

// Makes sure that testing is functioning okay
// If this fails, then everything else is likely failing as well
describe("Array", function() {
  describe("#indexOf()", function () {
    it("Should return -1 when the value is not present", function () {
      assert.equal(-1, [1,2,3].indexOf(5));
      assert.equal(-1, [1,2,3].indexOf(0));
    });
  });
});



// Load up Supertest package
var request = require("supertest");
setTimeout(runTests, 000);

// Work through the routes
// TO DO: Resolve issue of delay in superuser being created
function runTests () {
  describe("Boot up express.", function () {
    var server;
    
    // Start up the server each time (does this mean we have to login each time?)
    beforeEach(function () {
      server = require("../server/app");
    });
    
    // Drop all row values from the test table
    afterEach(function () {
      var deleteEverything = "TRUNCATE clients, cms, commconns, comms, convos, msgs, orgs;";
      db.raw(deleteEverything).then(function () {
        server.close();
      }).catch(function (err) { throw Error("afterEach failed during DB TRUNCATE: ", err)});
    });
    
    it("Index page", function (done) {
      request(server).get("/")
        .expect(302, done);
    });
    
    it("Login page", function (done) {
      request(server).get("/login")
        .expect(200, done);
    });

    it("Login as super user", function (done) {
      var req = request(server);
      u.superuserLogin(req, done);
    });

    it("Login as super user and create an org", function (done) {
      // Create server request object
      var req = request(server)

      // P1: First login as superuser
      u.superuserLogin(req, function () {

      // P2: POST a new organization
      req.post("/orgs")
        .field("name", "Example Organization")
        .field("phone", "18008008000")
        .field("email", "fooorg@foo.com")
        .field("expiration", "2020-01-01")
        .field("allotment", "10000")
        .expect(302, done);

      }); // P1
    });

    it("Create a supervisor for an organization", function (done) {
      // Create server request object
      var req = request(server)

      // P1: First login as superuser
      u.superuserLogin(req, function () {

      // P2: POST a new organization
      req.post("/orgs")
        .field("name", "Example Organization")
        .field("phone", "18008008000")
        .field("email", "fooorg@foo.com")
        .field("expiration", "2020-01-01")
        .field("allotment", "10000")
        .expect(302, function() {

      // P3: Create first supervisor for organization
      req.post("/orgs/1")
        .field("orgid", "1")
        .field("first", "Jim")
        .field("middle", "M")
        .field("last", "Surie")
        .field("email", "jim@foo.com")
        .field("password", "123")
        .field("position", "Supervisor")
        .field("department", "Pretrial")
        .field("admin", "true")
        .expect(302, done);
        
      }); // P2
      }); // P1
    });

    it("Successful session logout", function (done) {
      // Create server request object
      var req = request(server)

      // P1: First login as superuser
      u.superuserLogin(req, function () {

      // P2: Logout
      req.get("/logout")
        .expect(302, done);

      }); // P1
    });

    it("POST to login page", function (done) {
      // Create server request object
      var req = request(server)

      // P1: First login as superuser
      u.superuserLogin(req, function () {

      // P2: POST a new organization
      req.post("/orgs")
        .field("name", "Example Organization")
        .field("phone", "18008008000")
        .field("email", "fooorg@foo.com")
        .field("expiration", "2020-01-01")
        .field("allotment", "10000")
        .expect(302, function() {

      // P3: Create first supervisor for organization
      req.post("/orgs/1")
        .field("orgid", "1")
        .field("first", "Jim")
        .field("middle", "M")
        .field("last", "Surie")
        .field("email", "jim@foo.com")
        .field("password", "123")
        .field("position", "Supervisor")
        .field("department", "Pretrial")
        .field("admin", "true")
        .expect(302, function () {

      // P4: Logout
      req.get("/logout")
        .expect(302, function () {

      // P5: Login as the new user
      req.post("/login")
        .field("email", "jim@foo.com")
        .field("pass", "123")
        .expect(302, done);

      }); // P4
      }); // P3
      }); // P2
      }); // P1
    });
    
    it("POST to login page (V2 - Email must not be case sensitive)", function (done) {
      request(server).post("/login")
        .field("email", "JiM@foo.com")
        .field("pass", "123")
        .expect(302, done);
    });
    
    it("Be rerouted to splash page when already logged in", function (done) {
      request(server).post("/login")
        .field("email", "jim@foo.com")
        .field("pass", "123")
        .expect(302, done);
    });
    
    it("All unknown paths 404", function (done) {
      request(server).get("/foo/bar")
        .expect(404, done);
    });

  });
};


