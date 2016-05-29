var assert = require("chai").assert;

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


// Work through the routes
// TO DO: Resolve requirements issues
// Requirement 1: Organization must already be created
// Requirement 2: User accounts for both a case manager and a supervisor must already be created
// Requirement 3: Database prepopulated

describe("Boot up express.", function () {
  var server;
  
  // Start up the server each time (does this mean we have to login each time?)
  beforeEach(function () {
    server = require("../server/app");
  });
  
  afterEach(function () {
    server.close();
  });
  
  it("Index page", function (done) {
    request(server).get("/")
      .expect(302, done);
  });
  
  it("Login page", function (done) {
    request(server).get("/login")
      .expect(200, done);
  });
  
  it("POST to login page", function (done) {
    request(server).post("/login")
      .field("email", "tEsT@foo.com")
      .field("pass", "123")
      .expect(302, done);
  });
  
  it("POST to login page (V2 - Email must not be case sensitive)", function (done) {
    request(server).post("/login")
      .field("email", "TEST@foo.com")
      .field("pass", "123")
      .expect(302, done);
  });
  
  it("Be rerouted to splash page when already logged in", function (done) {
    request(server).post("/login")
      .field("email", "test@foo.com")
      .field("pass", "123")
      .expect(302);
  });
  
  it("All unknown paths 404", function (done) {
    request(server).get("/foo/bar")
      .expect(404, done);
  });

});