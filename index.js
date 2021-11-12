const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const mySecret = 'doNotShareThisSecretEver!';

const app = express();

app.use(cors());
app.use(express.json());

const connectDb = () => {
  if(!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(require('./credentials.json'))
    });
  }
  return admin.firestore();
}


app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const db = connectDb();
  db.collection('users')
    .where('username', '==', username)
    .where('password', '==', password)
    .get()
    .then(collection => {
      if(collection.empty) {
        res.status(401).send('Invalid username or password');
      } else {
        let user = collection.docs[0].data();
        user.id = collection.docs[0].id;
        user.password = undefined;
        const token = jwt.sign(user, mySecret);
        res.status(200).send(token);
      }
    })
    .catch(err => {
      res.status(500).send(err);
    });
});

app.get('/authenticated', (req, res) => {
  const token = req.headers.authorization;
  if(!token) {
    res.status(401).send('No token provided');
  } else {
    jwt.verify(token, mySecret, (err, decoded) => {
      if(err) {
        res.status(401).send('Invalid token');
      } else {
        if(decoded.username === 'todd@bocacode.com') {
          res.send('Hello Todd');
        } else {
          res.send('Hello ' + decoded.username);
        }
      }
    })
  }
});

app.listen(3000, () => console.log('Listening on port 3000...'));