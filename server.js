const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config({ path: './config.env' });
const app = require('./app');

// --------------------  External -----------------------------

process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// -------------------- DATABASE --------------------//
const DB = process.env.DATABASE_URL.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then((con) => 
    // console.log(con),
    console.log('DB connection successful!')
)
  .catch(err => {
    console.log('ERROR connecting to DB:', err);
    process.exit(1);
  });
//---------- 


// const testTour = new Tour({
//   name: 'The Park Camper',
//   rating:4.7,
//   price: 497
// })

// testTour.save().then(doc => {
//   console.log(doc);
// }).catch(err => {
//   console.log('ERROR:', err);
// });

//--------------------- START SERVER ---------------------//
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

