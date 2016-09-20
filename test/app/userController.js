const assert = require('assert');
const supertest = require('supertest');
const should = require('should');

const APP = require('../../app/app')

const Client = require('../../app/models/client');
const Clients = require('../../app/models/clients');
const Users = require('../../app/models/users');

const owner = supertest.agent(APP)
const supervisor = supertest.agent(APP)
const primary = supertest.agent(APP)
const anonymous = supertest.agent(APP)
// request = session(APP)

// http://mherman.org/blog/2016/04/28/test-driven-development-with-node/

describe('Basic http req tests', function() {

  it('should redirect from root', function(done) {
    anonymous.get('/')
      .expect(302)
      .expect('Location', '/login')
      .end(function(err, res) {
        done(err);
      });
  });

  it('should be able to view login page', function(done) {
    anonymous.get('/login')
      .expect(200)
      .end(function(err, res) {
        done(err);
      });
  });

  it('should redirect from root', function(done) {
    anonymous.post('/login')
      .field('email', 'af@sadf')
      .field('pass', 'pass')
      .expect(302)
      .expect('Location', '/login-fail')
      .end(function(err, res) {
        done(err);
      });
  });

  it('owner should login with real creds', function(done) {
    owner.post('/login')
      .type('form')
      .send({'email':'owner@test.com'})
      .send({'pass':'123'})
      .expect(302)
      .expect('Location', '/')
      .end(function(err, res) {
        done(err);
      });
  });

  it('primary user should login with real creds', function(done) {
    primary.post('/login')
      .type('form')
      .send({'email':'primary@test.com'})
      .send({'pass':'123'})
      .expect(302)
      .expect('Location', '/')
      .end(function(err, res) {
        done(err);
      });
  });  

  it('logged in owner user should redirect to org', function(done) {
    owner.get('/')
      .expect(302)
      .expect('Location', '/org')
      .end(function(err, res) {
        done(err);
      });
  });

  it ('logged in owner should be able to see the department', function(done) {
    owner.get('/org/departments')
      .expect(200)
      .end(function(err, res) {
        res.text.should.match(/Pretrial LKJKLJUnique/)
        done(err);
      });
  });

  it ('logged in primary shoud not be able to create user', function(done) {
    primary.post('/org/users/create')
      .expect(302)
      .expect('Location', '/login')
      .end(function(err, res) {
        done(err);
      })
  });

  it('owner should be able to create user', function(done) {
    owner.post('/org/users/create')
      .send({
        first: 'kuan',
        last: 'butts',
        email: 'kuan@butt.s',
        position: 'captain',
        className: 'name of class',
      })
      .expect(302)
      .end(function(err, res) {
        if (err) throw err;
        Users.findByEmail('kuan@butt.s')
        .then((user) => {
          should.exist(user);
          user.first.should.be.exactly('kuan');
          done();
        }).catch(done);
      });
  });

  it('primary user should have option to load templates on quick message', function(done) {
    owner.post('/org/clients/create')
      .send({
        targetUser: 2,
        first: "Jim",
        middle: "K",
        last: "Halpert",
        dob: "1990-02-03",
        uniqueID1: 324,
        uniqueID2: 23234,
      })
      .expect(302)
      .end(function(err, res) {
        if (err) {
          done(err);
        } else {
          primary.get('/clients/2/address')
            .expect(200)
            .end(function(err, res) {
              res.text.should.match(/Load a template/)
              done(err);
            });
        }
      });
  });

  it('primary user should reroute to create if no comm methods for client', function(done) {
    primary.get('/clients/1/communications')
      .expect(302)
      .end(function(err, res) {
        done(err);
      });
  });

  it('owner user should not have option to load templates on quick message', function(done) {
    owner.get('/org/clients/1/address')
      .expect(200)
      .end(function(err, res) {
        res.text.should.not.match(/Load a template/)
        done(err);
      });
  });

  it('owner should be able to close any client', function(done) {
    owner.get('/org/clients/1/alter/close')
    .expect(302)
      .end(function(err, res) {
        Client.findByID(1)
        .then((user) => {
          if (user.active) {
            done(new Error("User was not successfully closed."));
          } else {
            done(null);
          }
        }).catch(done);
      });
  });

  it('owner should be able to open any client', function(done) {
    owner.get('/org/clients/1/alter/open')
    .expect(302)
      .end(function(err, res) {
        Client.findByID(1)
        .then((user) => {
          if (!user.active) {
            done("User was not successfully closed.");
          } else {
            done(null);
          }
        }).catch(done);
      });
  });

  it('primary can add their own client', function(done) {
    primary.post('/clients/create')
      .field('first', 'Harry')
      .field('middle', 'E')
      .field('last', 'Kroner')
      .field('dob', '1927-10-12')
      .field('so', 3333)
      .field('otn', 9238)
    .expect(302)
    .expect('Location', '/clients')
      .end(function(err, res) {
        done(err);
      });
  });

  it('should be able to add a comm method to a client', function(done) {
    owner.post('/clients/1/communications/create')
      .field('description', 'DummyFoo1')
      .field('type', 'cell')
      .field('value', '18288384828')
    .expect(302)
      .end(function(err, res) {
        if (err) {
          done(err);
        } else {
          owner.get('/clients/1/communications')
          .expect(200)
            .end(function(err, res) {
              res.text.should.match(/Created new communication method/);
              done(err);
            })
        }
      });
  });

  it('should not be able to add the same communication method two times if first is still active', function(done) {
    owner.post('/clients/1/communications/create')
      .send({
        description: 'DummyFoo2',
        type: 'cell',
        value: '4444444444',
      })
    .expect(302)
      .end(function(err, res) {
        if (err) {
          done(err);
        } else {
          owner.get('/clients/1/communications')
          .expect(200)
            .end(function(err, res) {

              if (err) {
                done(err);
              } else {
                owner.post('/clients/1/communications/create')
                  .send({
                    description: 'DummyFoo2',
                    type: 'cell',
                    value: '4444444444',
                  })
                .expect(302)
                  .end(function(err, res) {
                    if (err) {
                      done(err);
                    } else {
                      owner.get('/clients/1/communications')
                      .expect(200)
                        .end(function(err, res) {
                          res.text.should.match(/Client already has that method/);
                          done(err);
                        })
                    }
                  });
              }
            })
        }
      });
  });

  // it('posting to voice should receive xml voice twilio response object', function(done) {
  //   anonymous.get('/twilio/voice')
  //     .expect(200)
  //     .end(function(err, res) {
  //       console.log(res.text)
  //       done(err);
  //     });
  // });

  // Write a test for clients list page features first
  // Then write features after
  // it () 

})