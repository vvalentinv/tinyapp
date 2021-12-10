const bcrypt = require("bcryptjs");

//Implement the function generateRandomString() here
const rndStr = function generateRandomString(num) {
  let tiny = "";
  const pool = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  for (let i = 0; i < num; i++) {
    tiny += pool[Math.floor(Math.random() * pool.length)]
  }
  return tiny;
}

//Find user by ID
// const findUserByUserID = (userId) => {
//   for (const id in users) {
//     const user = users[id];
//     if (user.id === userId) {
//       return user;
//     }
//   }
//   return null;
// }

//Find user by email
const findUserByUserEmail = (email, dB) => {
  for (const id in dB) {
    const user = dB[id];
    if (user.email === email) {
      return user;
    }
  }
  return null;
}

//Find shortURL by longURL
const findLongURLByShortURL = (shortURL, dB) => {
  for (const id in dB[shortURL]) {
    if (id === "longURL")
      return dB[shortURL][id];
  };
}

//handles authentication and conveniently returns the id if successfull
const authenticateUser = (email, password, dB) => {

  if (!email || !password) {
    return { err: "Email or Password cannot be empty!", id: null };
  }

  const userExists = findUserByUserEmail(email, dB);
  console.log('user', userExists);

  if (!userExists) {
    return { err: "User not found", id: null };
  }
  const passwordMatch = bcrypt.compareSync(password, userExists.password);
  if (!passwordMatch) {
    return { err: 'Your password doesnt match', id: null };
  }
  return { err: null, id: userExists.id };
}

//returns new urlDatabase with urls that belong to the user only
const urlsForUser = (user, dB) => {
  const userURLs = {}
  for (const shortURL in dB) {
    if (dB[shortURL].userID === user.id) {
      userURLs[shortURL] = { longURL: dB[shortURL].longURL, userID: user.id }
    }
  }
  return userURLs;
}

module.exports = { rndStr, urlsForUser, authenticateUser, findLongURLByShortURL, findUserByUserEmail };
