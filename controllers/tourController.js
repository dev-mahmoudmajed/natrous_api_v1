// const fs = require('fs');
const { Query } = require('mongoose');
const {Tour} = require('../models/tourModel'); 
const APIFeatires = require('../utlis/apiFeature');

/*
  middleware to handle request 
  from this 
  http://localhost:3000/api/v1/tours?limit=5&sort=-ratingAverage,price
  to this
  
*/
exports.aliasTopTours=(req,res,next)=>{
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
}

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// exports.checkID = (req, res, next, val) => {
//   console.log(`Tour id is: ${val}`);

//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID'
//     });
//   }
//   next();
// };

// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing name or price'
//     });
//   }
//   next();
// };

/*
natrous_api
*/

exports.getAllTours = async(req, res) => {
  // console.log(req.requestTime);
  // console.log(req.query);
  
  try{
  /*query Before Refactor to class
  ---------------------{    Build Query     }-----------------------------
  -------- 1- Basic filtering
  const tours =await Tour.find();
  const tours =await Tour.find({
    duration: 5,
    difficulty: 'easy'
  });
  const queryObj = {...req.query}
  const excludedFields = ['page', 'sort', 'limit', 'fields']
  excludedFields.forEach(el => delete queryObj[el])
  // console.log(req.query, queryObj);
  // const query =await Tour.find(queryObj);

  //------- 2)-Advanced filtering
  // { duration: { gte: '5' }, difficulty: 'easy' } { duration: { gte: '5' }, difficulty: 'easy' }
  // const tours =await Tour.find().where('duration').equals(5).where('difficulty').equals('easy');
  //gte -> greater than or equal , gt -> greater than , lte -> lower than or equal  , lt -> lower than
  //http://localhost:3000/api/v1/tours?duration[gte]=5&difficulty=easy
  let queryStr = JSON.stringify(queryObj)
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g,match => `$${match}`)
  console.log(JSON.parse(queryStr));
  let query = Tour.find(JSON.parse(queryStr));

  -------- 3- Sorting
  //http://localhost:3000/api/v1/tours?sort=price,ratingsAverage
    if(req.query.sort){
      const sortBy = req.query.sort.split(',').join(' ')
      console.log(sortBy);
      query.sort(sortBy)
    }else{
      query = query.sort('-createdAt')
    }
    //-------- 4)-feilds Limiting
    //http://localhost:3000/api/v1/tours?fields=name,duration
    if(req.query.fields){
      const fields = req.query.fields.split(',').join(' ')
      query = query.select(fields)
    }else{
      query = query.select('-__v')
    }
    -------- 5)-Pagination
    const page = req.query.page * 1 || 1
    const limit = req.query.limit * 1 || 50
    const skip = (page - 1) * limit
    query = query.skip(skip).limit(limit)
    if(req.query.page){
      const numTours = await Tour.countDocuments()
      if(skip >= numTours) throw new Error('This page does not exist')
    }

  ---------------------{  Execute query  }-----------------------------

  !!

*/
  
  const features = new APIFeatires(Tour.find(), req.query ).filter().sort().limitFields().paginate();
  const tours = await features.query;

  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: {
      tours
    }
  });}catch(err){
    res.status(404).json({
      status:'fail',
      message:err
    })
  }

};

exports.getTour = async(req, res) => {
  // console.log(req.params);
  try{
    const tour = await Tour.findById(req.params.id)
    /*
    Tour.findById(req.params.id) 
    Tour.findOne({_id: req.params.id})
    Tour.find({name: 'The Forest Hiker'})
    */
    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    })
  }catch(err){
    res.status(404).json({
      status:'fail',
      message:err
    })
  }

  // const tour = tours.find(el => el.id === id);

  // res.status(200).json({
  //   status: 'success',
  //   data: {
  //     tour
  //   }
  // });
};

exports.createTour = async(req, res) => {
  try {
    const newTour = await Tour.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour
      }
    });
  } catch(err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

exports.updateTour = async(req, res) => {
  try{
  Tour.findOneAndUpdate({_id: req.params.id}, req.body, {new: true, runValidators: true});
  
  res.status(200).json({
    status: 'success',
    data: {
      tour: tour
    }
  });
}catch(err){
  res.status(404).json({
    status:'fail',
    message:err
  })
}};

exports.deleteTour = async(req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: 'success',
      data: null
    });
  } 
  catch(err) {
    res.status(404).json({
      status: 'fail',
      message: err.message
    });
  }
};

//------------------- { Aggregation Pipeline  ( MongoDB Feature )}------------------------------

exports.getTourStats = async(req, res) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } }
      },
      {
        $group: {
          _id:{ $toUpper: '$difficulty'},
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      },
      {
        $sort: { avgPrice: 1 }
      }
    ])
    res.status(200).json({
      status:'success',
      data: {
        stats
      }
    });
  } 
  catch(err) {
    res.status(404).json({
      status: 'fail',
      message: err.message
    });
  }
}








