var assert = require('assert');
process.env.TESTENV = true
http_mocks = require('node-mocks-http')
should = require('should')

function buildResponse() {
  return http_mocks.createResponse(
    {
      eventEmitter: require('events').EventEmitter
    }
  )
}

const APP = require('../../server/app')


let responseTest = function(requestData, callback) {
  return function(done) {
    var res = buildResponse()
    var req  = http_mocks.createRequest(requestData)

    res.on('end', () => {
      callback(res, req, done)
    })

    APP.handle(req, res)
  }
}

describe('Basic http req tests', function() {

  it('root', responseTest({
      method: 'GET',
      url: '/',
    }, (res, req, done) => {
      res.statusCode.should.equal(302);
      done()      
    })
  )

  it('login', responseTest({
      method: 'GET',
      url: '/login',
    }, (res, req, done) => {
      res.statusCode.should.equal(200);
      done()      
    })
  )

})


// describe('Basic http req tests', function() {

//   it('root', function(done) {

//     var res = buildResponse()
//     var req  = http_mocks.createRequest({
//       method: 'GET',
//       url: '/',
//     })

//     res.on('end', function() {
//       res.statusCode.should.equal(302);
//       done()
//     })

//     APP.handle(req, res)
//   })

// })