const { assert } = require('chai');

const { findUserByUserEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('findUserByUserEmail', function() {
  it('should return a user with valid email', function() {
    const user = findUserByUserEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    // Write your assert statement here
    assert.deepEqual(user, testUsers[expectedUserID]);
  });

  it('should return undefined for an email that is not in the database', function() {
    const user = findUserByUserEmail("a@a.ca", testUsers)
    // Write your assert statement here
    assert.isNotOk(user);
  });
});
