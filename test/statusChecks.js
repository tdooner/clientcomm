var assert = require('chai').assert;

// Makes sure that testing is functioning okay
// If this fails, then everything else is likely failing as well
describe('Array', function() {
  describe('#indexOf()', function () {
    it('should return -1 when the value is not present', function () {
      assert.equal(-1, [1,2,3].indexOf(5));
      assert.equal(-1, [1,2,3].indexOf(0));
    });
  });
});


var request = require('supertest');

describe("Boot up express.", function () {
  var server;
  
  beforeEach(function () {
    server = require('../server/app');
  });
  
  afterEach(function () {
    server.close();
  });
  
  it('responds to /', function testSlash(done) {
  
  request(server)
    .get('/')
    .expect(302, done);
  });
  
  it('404 everything else', function testPath(done) {
    request(server)
      .get('/foo/bar')
      .expect(404, done);
  });

  it('protects against sql injection on the edit to commconn route', function testSqlInjectionInEditCommConn() {
  	request(server)
  		.post('/14/cls/6/comms/22')
  });
});