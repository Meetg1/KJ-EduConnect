const express = require("express");
const app = express();
require("dotenv").config();
const path = require("path");
const ejsMate = require("ejs-mate");
const courses = require("./courses");
const subjects = require("./subjects");
const mongoose = require("mongoose");
const User = require("./models/user.js");
const Document = require("./models/Document.js");
const Review = require("./models/Review.js");
const Reply = require("./models/Reply.js");
const Notification = require("./models/Notification");
const Request = require("./models/Request");
const Stat = require("./models/Stat");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const flash = require("connect-flash");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const {
  uploadToDrive,
  getFileFromDrive,
  deleteFromDrive,
} = require("./driveApi.js");
const expressValidator = require("express-validator");
const { v1: uuidv1 } = require("uuid");
const methodOverride = require("method-override");
const fs = require("fs");
const crypto = require("crypto");
const schedule = require("node-schedule");

const cookieSession = require("cookie-session");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
//const { PDFNet } = require("@pdftron/pdfnet-node");

const mime_Type = require('./node_modules/mime-types');

//====================DATABASE CONNECTION==========================

// const dbUrl = "mongodb://localhost:27017/edu";
const dbUrl = process.env.MY_MONGODB_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(dbUrl, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useFindAndModify: false,
      useCreateIndex: true,
    });
    console.log("DATABASE CONNECTED");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};
// CONNECT DATABASE
connectDB();

app.use(express.json());
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public"))); //for serving static files
app.use(
  express.urlencoded({
    extended: true,
  })
); //for parsing form data
app.use(methodOverride("_method"));
app.use(flash());

app.use(
  session({
    secret: "#sms#",
    resave: true,
    saveUninitialized: true,
  })
);

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function resetTrendingDocuments() {
  let allDocs = await Document.find({});
  allDocs.forEach(async (doc) => {
    doc.recentDownloads = 0;
    await doc.save();
  });
}

//run at 12am on every saturday
schedule.scheduleJob("0 0 * * 6", function () {
  try {
    resetTrendingDocuments();
    console.log("resetting...");
  } catch (err) {
    console.log(err);
  }
});

async function sendMail(receiver, link) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "shubh.gosalia@somaiya.edu",
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      from: "EduConnect <shubh.gosalia@somaiya.edu>",
      to: receiver,
      subject: "EduConnect:Password Reset",
      text: `<p>Kindly Click <a href=${link}>here</a> to reset your password!</p>`,
      html: `<p>Kindly Click <a href=${link}>here</a> to reset your password!</p>`,
    };

    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
    return error;
  }
}

async function sendverifyMail(receiver, link) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "shubh.gosalia@somaiya.edu",
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      from: "EduConnect <shubh.gosalia@somaiya.edu>",
      to: receiver,
      subject: "EduConnect:Verify Your Email",
      text: `<p>Kindly Click <a href=${link}>here</a> to verify your e-mail!</p>`,
      html: `<p>Kindly Click <a href=${link}>here</a> to verify your e-mail!</p>`,
    };

    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
    return error;
  }
}

const JWT_SECRET = process.env.JWT_SECRET;

//===================================================================

//========================PASSPORT SETUP=============================
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

// To Use Google Login System
// passport.serializeUser(function(user, done) {
//   console.log(user);
//   /*
//   From the user take just the id (to minimize the cookie size) and just pass the id of the user
//   to the done callback
//   PS: You dont have to do it like this its just usually done like this
//   */

//   done(null, user);
// });

// passport.deserializeUser(function(user, done) {
//   /*
//   Instead of user this function usually recives the id
//   then you use the id to select the user from the db and pass the user obj to the done callback
//   PS: You can later access this data in any routes in: req.user
//   */

//   done(null, user);

// });

// To Use Normal Login System
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//===================================================================

//Express Messages Middle ware
app.use(require("connect-flash")());
app.use(async function (req, res, next) {
  //giving access of loggedIn user to every templates(in views dir)
  res.locals.currentUser = req.user;
  //giving access of loggedIn user's notifications to every templates(in views dir) (have to populate first though)
  if (req.user) {
    try {
      const user = await User.findById(req.user._id)
        .populate("notifications")
        .exec();
      res.locals.notifications = user.notifications.reverse(); //latest notifications first
    } catch (error) {
      console.error(error.message);
    }
  }
  res.locals.messages = require("express-messages")(req, res);
  next();
});

// Express Validator Middleware
app.use(
  expressValidator({
    errorFormatter: function (param, msg, value) {
      var namespace = param.split("."),
        root = namespace.shift(),
        formParam = root;

      while (namespace.length) {
        formParam += "[" + namespace.shift() + "]";
      }
      return {
        param: formParam,
        msg: msg,
        value: value,
      };
    },
  })
);
//====================middlewares===================================
const isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("danger", "Please Log In First!");
    return res.redirect("back");
  }
  next();
};

const checkReviewExistence = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("danger", "Please Log In First!");
    return res.redirect("/results/upvotes/1");
  }
  Document.findOne({ slug: req.params.slug })
    .populate("reviews")
    .exec(function (err, foundDoc) {
      if (!foundDoc || err) {
        console.log(err);
        return res.redirect("/results/upvotes/1");
      }
      const foundReview = foundDoc.reviews.some(function (review) {
        return review.author.equals(req.user._id);
      });
      if (foundReview) {
        req.flash("danger", "You have already reviewed this document!");
        res.redirect("/single_material/" + req.params.slug);
      } else if (foundDoc.uploader.id.equals(req.user._id)) {
        req.flash("danger", "You cant review your own document!");
        res.redirect("/single_material/" + req.params.slug);
      } else {
        next();
      }
    });
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    function (request, accessToken, refreshToken, profile, done) {
      User.findOne({ username: profile.email }).then((currentUser) => {
        if (currentUser) {
          currentUser.isVerified = true;
          currentUser.save();
          console.log(currentUser);
          request.flash(
            "success",
            "Welcome to EduConnect " + currentUser.fullname + "!"
          );
          done(null, currentUser);
          chk = 1;
        } else {
          // new User ({
          //   username: profile.email,
          //   university: "KJSCE",
          //   password: "abcd",
          //   fullname: profile.displayName,
          // }).save().then((newUser) => {
          //   done(null, newUser);
          // });
          request.flash("danger", "That email id is not registered!");
          done(null, null);

          //return res.redirect("/landing ");
        }
      });
      // if(chk==0){
      //   request.flash("danger", "That email id is not registered!");
      // }
      console.log(profile);
    }
  )
);

const checkReportExistence = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("danger", "Please Log In First!");
    return res.redirect("/results/upvotes/1");
  }
  try {
    const foundDoc = await Document.findOne({ slug: req.params.slug });
    if (!foundDoc) {
      return res.redirect("/results/upvotes/1");
    }
    const foundReport = foundDoc.reporters.some(function (reporter) {
      return reporter.equals(req.user._id);
    });
    if (foundReport) {
      req.flash("danger", "You have already reported this document!");
      return res.redirect("/single_material/" + req.params.slug);
    }
    next();
  } catch (error) {
    console.log(err);
  }
};

const isUploader = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("danger", "Please Log In First!");
    return res.redirect("/results/upvotes/1");
  }
  const doc = await Document.findOne({ slug: req.params.slug });
  const user = await User.findById(req.user._id);
  if (!user.role === "admin" && !doc.uploader.id.equals(req.user._id)) {
    req.flash("danger", "You do not have permission to do that!");
    return res.redirect("/results/upvotes/1");
  }
  next();
};

const isVerified = async function (req, res, next) {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user) {
      req.flash("danger", "No account with that email exists.");
      return res.redirect("/results/upvotes/1");
    }
    if (user.isVerified) {
      return next();
    }
    req.flash(
      "danger",
      "Your account has not been verified! Please check your email to verify your account."
    );
    return res.redirect("/results/upvotes/1");
  } catch (error) {
    console.log(error);
    req.flash(
      "danger",
      "Something went wrong! Please contact us for assistance"
    );
    res.redirect("/results/upvotes/1");
  }
};

const isAdmin = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("danger", "Please Log In First!");
    return res.redirect("/results/upvotes/1");
  }
  try {
    const user = await User.findById(req.user._id);
    if (!user.role === "admin") {
      req.flash("danger", "You are not an admin!");
      return res.redirect("back");
    }
    next();
  } catch (error) {
    console.log(error);
  }
};

const isNotBanned = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (user.isBanned) {
      req.flash(
        "danger",
        "You have been banned! Contact us for more information."
      );
      return res.redirect("/results/upvotes/1");
    }
    next();
  } catch (error) {
    console.log(error);
  }
};
//====================middlewares===================================

//=======================MULTER=====================================
const storage1 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
  limits: {
    fileSize: 100000000, // max file size 100MB
  },
});

var upload1 = multer({
  storage: storage1,
});

// var storage2 = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, path.join(__dirname, "public/previewPics"));
//   },
//   filename: function (req, file, cb) {
//     cb(null, uuidv1() + path.extname(file.originalname));
//   },
// });

// var upload2 = multer({
//   storage: storage2,
// });

var storage3 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "public/profilePic"));
  },
  filename: function (req, file, cb) {
    cb(null, uuidv1() + path.extname(file.originalname));
  },
});

var upload3 = multer({
  storage: storage3,
});

var file;
app.post("/uploadfile", upload1.single("file"), (req, res, next) => {
  file = req.file;
  console.log(file.destination);

  // console.log(file);
  if (!file) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    return next(error);
  }

  const { PDFNet } = require("@pdftron/pdfnet-node");
  //const { filename, watermark } = req.query;
  PDFNet.initialize();
  const fn = file.filename;
  const watermark = "SOMAIYA";
  console.log(__dirname);
  
  const inputPath =path.resolve(
    file.destination + "/" + fn
  );
  const outputPath = path.resolve(
    file.destination + "/" + fn
  );

   
  console.log(inputPath, outputPath);
  const watermarkPDF = async () => {
    try{

    const pdfdoc = await PDFNet.PDFDoc.createFromUFilePath(inputPath);
   
    await pdfdoc.initSecurityHandler();
    
    const stamper = await PDFNet.Stamper.create(
      PDFNet.Stamper.SizeType.e_relative_scale,
      0.5,
      0.5
    );

    stamper.setAlignment(
      PDFNet.Stamper.HorizontalAlignment.e_horizontal_center,
      PDFNet.Stamper.VerticalAlignment.e_vertical_center
    );

    const redColorPt = await PDFNet.ColorPt.init(1, 0, 0);
    stamper.setFontColor(redColorPt);
    const pgSet = await PDFNet.PageSet.createRange(
      1,
      await pdfdoc.getPageCount()
    );

    await stamper.stampText(pdfdoc, watermark, pgSet);

    await pdfdoc.save(outputPath, PDFNet.SDFDoc.SaveOptions.e_linearized);
  

    } catch (err){
      console.log("hello");
      console.log(err);
    }
  };  

  PDFNet.runWithCleanup( watermarkPDF) // you can add the key to PDFNet.runWithCleanup(main, process.env.PDFTRONKEY)
    .then(() => {
       PDFNet.shutdown();
       res.send(file);
      //  res.redirect("back");
      // fs.readFile(outputPath, (err, data) => {
      //   if (err) {
      //     res.statusCode = 500;
      //     res.end(`Error getting the file: ${err}.`);
      //   } else {
      //     const ext = path.parse(outputPath).ext;
      //    res.setHeader("Content-type", mime_Type[ext] || "text/plain");
      //    res.send(data);
      //    //res.jsonp({"Result":"Success"});
      //   //res.writeHead(200, { 'Content-Type': 'application/json' });
      //   //res.write(JSON.stringify(data));
      //   //res.send(data);
      //   }
      // });
    })
    .catch((error) => { 
      res.statusCode = 500;
      res.end(error);
    });


  // res.send(file);
});

// var previewPicIds = [];
// app.post("/uploadpics", upload2.single("file"), (req, res, next) => {
//   previewPicIds.push(req.file.filename);
//   // console.log(file);
//   if (!file) {
//     const error = new Error("Please upload a file");
//     error.httpStatusCode = 400;
//     return next(error);
//   }

//   res.send(file);
// });

app.get("/", (req, res) => {
  res.redirect("/results/upvotes/1");
});

app.post("/uploadprofile", upload3.single("file"), async (req, res, next) => {
  //profilePicIds.push(req.file.filename);
  try {
    const user = await User.findById(req.user._id);
    console.log(req.file);
    file = req.file;
    if (!file) {
      req.flash("danger", "Please select a picture first.");
      return res.redirect("back");
    }

    user.profilePic = req.file.filename;
    user.save();
    req.flash("success", "Profile picture is updated");
    return res.redirect("/users/" + user._id);
  } catch (error) {}
});

//============================================================

app.get("/download/:slug", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const doc = await Document.findOne({ slug: req.params.slug });
    await getFileFromDrive(doc.driveId, doc.fileName);
   // console.log(getFileFromDrive(doc.driveId, doc.fileName));
    setTimeout(function () {
      res.download(__dirname + "/downloads/" + doc.fileName);
      user.save();
    }, 5000);
    let stat = await Stat.findOne({ id: 1 });
    stat.totalDownloads++;
    stat.save();
    doc.downloads++;
    doc.recentDownloads++;
    doc.save();
  } catch (error) {
    console.log(error);
    res.status(400).send("Error while downloading file. Try again later.");
  }
});

//============================================================

app.post("/upload", isLoggedIn, async (req, res) => {
  console.log(req.body);
  try {
    const {
      university,
      course,
      title,
      category,
      year,
      subject,
      num_pages,
      description,
    } = req.body;

    req.checkBody("university", "University is required").notEmpty();
    req.checkBody("course", "Course is required").notEmpty();
    req.checkBody("title", "Title is required").notEmpty();
    req.checkBody("category", "Category is required").notEmpty();
    req.checkBody("year", "year is required").notEmpty();
    req.checkBody("subject", "Subject is required").notEmpty();
    req.checkBody("num_pages", "num_pages is required").notEmpty();
    req.checkBody("description", "description is required").notEmpty();

    let errors = req.validationErrors();
    if (errors) {
      console.log("sgdagsgfds" + errors);
      return res.redirect("back");
    }
    // if (previewPicIds.length == 0) {
    //   return res.redirect("back");
    // }

    const uploadedFile = await uploadToDrive(file.originalname, file.mimetype);

    const driveId = uploadedFile.data.id;
    const uploader = {
      id: req.user._id,
      username: req.user.username,
    };
    const doc = new Document({
      university: university,
      course: course,
      title: title,
      category: category,
      year: year,
      subject: subject,
      num_pages: num_pages,
      description: description,
      uploader: uploader,
      driveId: driveId,
      mimeType: file.mimetype,
      fileName: file.originalname,
      // previewPics: previewPicIds,
    });

    const uploadedDoc = await doc.save();
    // console.log(uploadedDoc);
    const foundUser = await User.findById(req.user._id)
      .populate("followers")
      .exec();
    foundUser.uploads = foundUser.uploads + 1;

    foundUser.level_points = foundUser.level_points + 40;
    var prev_lvl = foundUser.level;
    var next_lvl = prev_lvl + 1;
    if (foundUser.level_points >= foundUser.check_point + next_lvl * 100) {
      foundUser.check_point = foundUser.check_point + next_lvl * 100;
      foundUser.level++;
    }
    if (doc.category == "Lecture Notes") {
      foundUser.notes_uploads++;
    } else if (doc.category == "Question Paper") {
      foundUser.papers_uploads++;
    } else if (doc.category == "Assignment") {
      foundUser.assignments_uploads++;
    }
    foundUser.save();
    // previewPicIds = [];
    let stat = await Stat.findOne({ id: 1 });
    stat.totalDocuments++;
    stat.save();

    //creating the notification body
    let newNotification = {
      username: foundUser.username,
      documentId: doc.slug,
      message: "uploaded a new document!",
    };
    //pushing the notification into each follower
    let followers = foundUser.followers;
    followers.forEach(async (follower) => {
      let notification = await Notification.create(newNotification);
      follower.notifications.push(notification);
      await follower.save();
    });

    /*    

         const getThumbFromPDF=async () =>{
          const doc=await PDFNet.PDFDoc.createFromFilePath(inputPath);
          await doc.initSecurityHandler();
          const pdfDraw=await PDFNet.PDFDraw.create(92);
          const currPage=await doc.getPage(1);
          await pdfDraw.export(currPage,outputPath,'PNG')
    }

    
    PDFNet.runWithCleanup(getThumbFromPDF).then(() => {
      fs.readFile(outputPath,(err,data)=>{
         if(err){
           res.statusCode=500;
           res.end(err);
         }else{
            res.setHeader('ContentType','image/png');
            res.end(data);
         }
      })
    }).catch(err =>{
       res.statusCode=500;
       res.end(err);
    });
  */  

    //deleting file from uploads folder
    let pathToFile = path.join(__dirname, "uploads", doc.fileName);
    //console.log("path: "+pathToFile)
    fs.unlink(pathToFile, function (err) {
      if (err) {
        throw err;
      } else {
        console.log("Successfully deleted the file : " + pathToFile);
      }
    });

    file = undefined;
  } catch (error) {
    res.redirect("results/upvotes/1");
    console.log(error);
  }
});

app.get("/results/:sortBy/:page", async (req, res) => {
  var limit = 3;
  var page = req.params.page;

  var skip = (page - 1) * limit;

  var num_of_docs = await Document.countDocuments();
  var number_of_pages = Math.ceil(num_of_docs / limit);

  //  if(docs.length % limit !=0 ){
  //    number_of_pages = number_of_pages + 1;
  //  }
  // console.log("pages: "+number_of_pages);
  let sort = req.params.sortBy;
  var docs;
  var type;
  if (sort === "upvotes") {
    docs = await Document.find().sort({ upvotes: -1 });
    docs = docs.slice(skip, skip + limit);
    type = "upvotes";
  } else if (sort === "downloads") {
    docs = await Document.find().sort({ downloads: -1 });
    docs = docs.slice(skip, skip + limit);
    type = "downloads";
  } else if (sort === "trending") {
    docs = await Document.find().sort({ recentDownloads: -1 });
    docs = docs.slice(skip, skip + limit);
    type = "trending";
  } else if (sort === "recent") {
    docs = await Document.find().sort({ year: -1 });
    docs = docs.slice(skip, skip + limit);
    type = "recent";
  }

  if (req.user) {
    const user = await User.findById(req.user._id);
    if (user.role === "admin") {
      return res.redirect("/admin/statistics");
    }
    res.render("results.ejs", {
      docs: docs,
      stared: user.stared,
      number_of_pages: number_of_pages,
      current_page: page,
      redirect: type,
      type: type,
      page: "results",
    });
  } else {
    res.render("results.ejs", {
      docs: docs,
      number_of_pages: number_of_pages,
      current_page: page,
      redirect: "results",
      type: type,
      page: "results",
    });
  }
});
var keyword = "";
app.post("/search/:sortBy/:page", async (req, res) => {
  keyword = req.body.keyword;

  var limit = 3;
  var page = req.params.page;
  var skip = (page - 1) * limit;

  let sort = req.params.sortBy;
  var docs;
  var type;
  if (sort === "upvotes") {
    docs = await Document.find({
      $or: [
        { university: { $regex: new RegExp(keyword, "i") } },
        { course: { $regex: new RegExp(keyword, "i") } },
        { title: { $regex: new RegExp(keyword, "i") } },
        { subject: { $regex: new RegExp(keyword, "i") } },
      ],
    }).sort({ upvotes: -1 });
    docs = docs.slice(skip, skip + limit);
    type = "upvotes";
  } else if (sort === "downloads") {
    docs = await Document.find({
      $or: [
        { university: { $regex: new RegExp(keyword, "i") } },
        { course: { $regex: new RegExp(keyword, "i") } },
        { title: { $regex: new RegExp(keyword, "i") } },
        { subject: { $regex: new RegExp(keyword, "i") } },
      ],
    }).sort({ downloads: -1 });
    docs = docs.slice(skip, skip + limit);
    type = "downloads";
  } else if (sort === "trending") {
    docs = await Document.find({
      $or: [
        { university: { $regex: new RegExp(keyword, "i") } },
        { course: { $regex: new RegExp(keyword, "i") } },
        { title: { $regex: new RegExp(keyword, "i") } },
        { subject: { $regex: new RegExp(keyword, "i") } },
      ],
    }).sort({ recentDownloads: -1 });
    docs = docs.slice(skip, skip + limit);
    type = "trending";
  } else if (sort === "recent") {
    docs = await Document.find({
      $or: [
        { university: { $regex: new RegExp(keyword, "i") } },
        { course: { $regex: new RegExp(keyword, "i") } },
        { title: { $regex: new RegExp(keyword, "i") } },
        { subject: { $regex: new RegExp(keyword, "i") } },
      ],
    }).sort({ year: -1 });
    docs = docs.slice(skip, skip + limit);
    type = "recent";
  }

  var num_of_docs = docs.length;
  var number_of_pages = Math.ceil(num_of_docs / limit);

  docs = docs.slice(skip, skip + limit);

  if (req.user) {
    const user = await User.findById(req.user._id);
    if (user.role === "admin") {
      return res.redirect("/admin/statistics");
    }
    res.render("results.ejs", {
      docs: docs,
      stared: user.stared,
      number_of_pages: number_of_pages,
      current_page: page,
      type: type,
      page: "search",
      redirect: "search",
    });
  } else {
    res.render("results.ejs", {
      docs: docs,
      number_of_pages: number_of_pages,
      current_page: page,
      type: type,
      page: "search",
      redirect: "search",
    });
  }
});

app.get("/search/:sortBy/:page", async (req, res) => {
  var limit = 3;
  var page = req.params.page;
  var skip = (page - 1) * limit;

  let sort = req.params.sortBy;
  var docs;
  var type;
  if (sort === "upvotes") {
    docs = await Document.find({
      $or: [
        { university: { $regex: new RegExp(keyword, "i") } },
        { course: { $regex: new RegExp(keyword, "i") } },
        { title: { $regex: new RegExp(keyword, "i") } },
        { subject: { $regex: new RegExp(keyword, "i") } },
      ],
    }).sort({ upvotes: -1 });
    docs = docs.slice(skip, skip + limit);
    type = "upvotes";
  } else if (sort === "downloads") {
    docs = await Document.find({
      $or: [
        { university: { $regex: new RegExp(keyword, "i") } },
        { course: { $regex: new RegExp(keyword, "i") } },
        { title: { $regex: new RegExp(keyword, "i") } },
        { subject: { $regex: new RegExp(keyword, "i") } },
      ],
    }).sort({ downloads: -1 });
    docs = docs.slice(skip, skip + limit);
    type = "downloads";
  } else if (sort === "trending") {
    docs = await Document.find({
      $or: [
        { university: { $regex: new RegExp(keyword, "i") } },
        { course: { $regex: new RegExp(keyword, "i") } },
        { title: { $regex: new RegExp(keyword, "i") } },
        { subject: { $regex: new RegExp(keyword, "i") } },
      ],
    }).sort({ recentDownloads: -1 });
    docs = docs.slice(skip, skip + limit);
    type = "trending";
  } else if (sort === "recent") {
    docs = await Document.find({
      $or: [
        { university: { $regex: new RegExp(keyword, "i") } },
        { course: { $regex: new RegExp(keyword, "i") } },
        { title: { $regex: new RegExp(keyword, "i") } },
        { subject: { $regex: new RegExp(keyword, "i") } },
      ],
    }).sort({ year: -1 });
    docs = docs.slice(skip, skip + limit);
    type = "recent";
  }

  var num_of_docs = docs.length;
  var number_of_pages = Math.ceil(num_of_docs / limit);

  docs = docs.slice(skip, skip + limit);

  if (req.user) {
    const user = await User.findById(req.user._id);
    if (user.role === "admin") {
      return res.redirect("/admin/statistics");
    }
    res.render("results.ejs", {
      docs: docs,
      stared: user.stared,
      number_of_pages: number_of_pages,
      current_page: page,
      type: type,
      page: "search",
      redirect: "search",
    });
  } else {
    res.render("results.ejs", {
      docs: docs,
      number_of_pages: number_of_pages,
      current_page: page,
      type: type,
      page: "search",
      redirect: "search",
    });
  }
});

var university = "";
var course = "";
var year = "";
var category = "";
app.post("/filter/:sortBy/:page", async (req, res) => {
  university = req.body.university;
  course = req.body.course;
  year = req.body.year;
  category = req.body.category;
  console.log(university, course, year, category);

  var limit = 3;
  var page = req.params.page;
  var skip = (page - 1) * limit;

  let sort = req.params.sortBy;
  var docs;
  var type;
  if (sort === "upvotes") {
    docs = await Document.find({
      university: { $regex: new RegExp(university, "i") },
      course: { $regex: new RegExp(course, "i") },
      year: { $regex: new RegExp(year, "i") },
      category: { $regex: new RegExp(category, "i") },
    }).sort({ upvotes: -1 });
    docs = docs.slice(skip, skip + limit);
    type = "upvotes";
  } else if (sort === "downloads") {
    docs = await Document.find({
      university: { $regex: new RegExp(university, "i") },
      course: { $regex: new RegExp(course, "i") },
      year: { $regex: new RegExp(year, "i") },
      category: { $regex: new RegExp(category, "i") },
    }).sort({ downloads: -1 });
    docs = docs.slice(skip, skip + limit);
    type = "downloads";
  } else if (sort === "trending") {
    docs = await Document.find({
      university: { $regex: new RegExp(university, "i") },
      course: { $regex: new RegExp(course, "i") },
      year: { $regex: new RegExp(year, "i") },
      category: { $regex: new RegExp(category, "i") },
    }).sort({ recentDownloads: -1 });
    docs = docs.slice(skip, skip + limit);
    type = "trending";
  } else if (sort === "recent") {
    docs = await Document.find({
      university: { $regex: new RegExp(university, "i") },
      course: { $regex: new RegExp(course, "i") },
      year: { $regex: new RegExp(year, "i") },
      category: { $regex: new RegExp(category, "i") },
    }).sort({ year: -1 });
    docs = docs.slice(skip, skip + limit);
    type = "recent";
  }

  var num_of_docs = docs.length;
  var number_of_pages = Math.ceil(num_of_docs / limit);

  docs = docs.slice(skip, skip + limit);

  if (req.user) {
    const user = await User.findById(req.user._id);
    if (user.role === "admin") {
      return res.redirect("/admin/statistics");
    }
    res.render("results.ejs", {
      docs: docs,
      stared: user.stared,
      number_of_pages: number_of_pages,
      current_page: page,
      redirect: "filter",
      type: type,
      page: "filter",
    });
  } else {
    res.render("results.ejs", {
      docs: docs,
      number_of_pages: number_of_pages,
      current_page: page,
      redirect: "filter",
      type: type,
      page: "filter",
    });
  }
});

app.get("/filter/:sortBy/:page", async (req, res) => {
  console.log(university, course, year, category);

  var limit = 3;
  var page = req.params.page;
  var skip = (page - 1) * limit;

  let sort = req.params.sortBy;
  var docs;
  var type;
  if (sort === "upvotes") {
    docs = await Document.find({
      university: { $regex: new RegExp(university, "i") },
      course: { $regex: new RegExp(course, "i") },
      year: { $regex: new RegExp(year, "i") },
      category: { $regex: new RegExp(category, "i") },
    }).sort({ upvotes: -1 });
    docs = docs.slice(skip, skip + limit);
    type = "upvotes";
  } else if (sort === "downloads") {
    docs = await Document.find({
      university: { $regex: new RegExp(university, "i") },
      course: { $regex: new RegExp(course, "i") },
      year: { $regex: new RegExp(year, "i") },
      category: { $regex: new RegExp(category, "i") },
    }).sort({ downloads: -1 });
    docs = docs.slice(skip, skip + limit);
    type = "downloads";
  } else if (sort === "trending") {
    docs = await Document.find({
      university: { $regex: new RegExp(university, "i") },
      course: { $regex: new RegExp(course, "i") },
      year: { $regex: new RegExp(year, "i") },
      category: { $regex: new RegExp(category, "i") },
    }).sort({ recentDownloads: -1 });
    docs = docs.slice(skip, skip + limit);
    type = "trending";
  } else if (sort === "recent") {
    docs = await Document.find({
      university: { $regex: new RegExp(university, "i") },
      course: { $regex: new RegExp(course, "i") },
      year: { $regex: new RegExp(year, "i") },
      category: { $regex: new RegExp(category, "i") },
    }).sort({ year: -1 });
    docs = docs.slice(skip, skip + limit);
    type = "recent";
  }

  var num_of_docs = docs.length;
  var number_of_pages = Math.ceil(num_of_docs / limit);

  docs = docs.slice(skip, skip + limit);

  if (req.user) {
    const user = await User.findById(req.user._id);
    if (user.role === "admin") {
      return res.redirect("/admin/statistics");
    }
    res.render("results.ejs", {
      docs: docs,
      stared: user.stared,
      number_of_pages: number_of_pages,
      current_page: page,
      redirect: "filter",
      type: type,
      page: "filter",
    });
  } else {
    res.render("results.ejs", {
      docs: docs,
      number_of_pages: number_of_pages,
      current_page: page,
      redirect: "filter",
      type: type,
      page: "filter",
    });
  }
});

app.get("/users/:user_id/stared", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let stared = user.stared;
    let docs = await Document.find({ slug: { $in: [...stared] } });
    res.render("stared.ejs", {
      docs: docs,
    });
  } catch (error) {
    console.log(error);
  }
});

app.post("/results/:slug/addstar", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    // const foundDoc = await Document.findOne({ slug: req.params.slug });
    user.stared.push(req.params.slug);
    user.save();
    req.flash("success", "Document added to starred documents.");
    return res.redirect("back");
  } catch (error) {
    console.error(error);
    return redirect("/results/upvotes/1");
  }
});

app.post("/results/:slug/removestar", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    //removing the stared document from the user.stared array
    let i = 0;
    while (i < user.stared.length) {
      if (user.stared[i] == req.params.slug) {
        break;
      }
      i++;
    }
    if (i > -1) {
      user.stared.splice(i, 1);
    }
    user.save();
    req.flash("success", "Document removed from starred documents.");
    return res.redirect("back");
  } catch (error) {
    console.error(error);
    return redirect("/results/upvotes/1");
  }
});

app.get("/single_material/:slug", async function (req, res) {
  const doc = await Document.findOne({ slug: req.params.slug })
    .populate([
      {
        path: "reviews",
        populate: [
          { path: "author" },
          { path: "replies", populate: [{ path: "author_reply" }] },
        ],
      },
    ])
    .populate([
      {
        path: "suggestions",
        populate: [
          { path: "author" },
          { path: "replies", populate: [{ path: "author_reply" }] },
        ],
      },
    ])
    .populate({
      path: "uploader",
      populate: {
        path: "id",
      },
    });

  if (!doc) {
    req.flash("danger", "Cannot find that document!");
    return res.redirect("/results/upvotes/1");
  }

  if (!doc.isHidden) {
    return res.render("single_material.ejs", { doc });
  }

  if (req.user) {
    const user = await User.findById(req.user._id);

    if (user.role == "moderator" || user.role == "admin") {
      return res.render("single_material.ejs", { doc });
    } else {
      res.render("taken-down.ejs");
    }
  } else {
    res.render("taken-down.ejs");
  }
});

app.delete(
  "/single_material/:slug",
  isLoggedIn,
  isUploader,
  async (req, res) => {
    const doc = await Document.findOneAndDelete({ slug: req.params.slug }); //delete document from mongoDB
    deleteFromDrive(doc.driveId); //delete document from drive
    await Review.deleteMany({ _id: { $in: doc.reviews } }); //delete all reviews of the document

    //deleting file's previewPics
    // for (let i = 0; i < doc.previewPics.length; i++) {
    //   const pathToFile = path.join(
    //     __dirname,
    //     "public/previewPics",
    //     doc.previewPics[i]
    //   );
    //   console.log("path : " + pathToFile);
    //   fs.unlink(pathToFile, function (err) {
    //     if (err) {
    //       throw err;
    //     } else {
    //       console.log("Successfully deleted the file : " + pathToFile);
    //     }
    //   });
    // }

    let user = await User.findById(doc.uploader.id);
    user.level_points = user.level_points - 40;
    if (user.level_points < user.check_point) {
      user.check_point = user.check_point - 100 * user.level;
      user.level--;
    }
    user.uploads--;
    if (doc.category == "Lecture Notes") {
      user.notes_uploads--;
    } else if (doc.category == "Assignment") {
      user.assignments_uploads--;
    } else if (doc.category == "Question Paper") {
      user.papers_uploads--;
    }
    user.save();

    let stat = await Stat.findOne({ id: 1 });
    stat.totalDocuments--;
    stat.save();
    req.flash("success", "Successfully deleted Document.");
    res.redirect("/results/upvotes/1");
  }
);

app.post("/reply/:id/delete", async (req, res) => {
  console.log(req.params.id);
  const req_review = await Review.findById(req.body.comment_id);
  console.log(req_review);
  console.log(req.body.reply_id);
  req_review.replies.pop(req.body.reply_id);
  //req_review.replies.push(reply);
  await req_review.save();
  res.jsonp({ result: "success" });
});

app.post(
  "/single_material/:slug/report",
  isLoggedIn,
  checkReportExistence,
  async (req, res) => {
    const foundDoc = await Document.findOne({ slug: req.params.slug });
    const user = await User.findById(req.user._id);
    foundDoc.reporters.push(user);
    // console.log(foundDoc.reporters.length);
    if (foundDoc.reporters.length >= 5 || user.role == "moderator") {
      foundDoc.isHidden = true;
      req.flash("danger", "Document has been taken down!");
      res.redirect("back");
    } else if (foundDoc.reporters.length < 5) {
      req.flash("danger", "Document has been reported!");
      res.redirect("/single_material/" + req.params.slug);
    }
    foundDoc.save();
    let stat = await Stat.findOne({ id: 1 });
    stat.totalReports++;
    stat.save();

    const uploader = await User.findById(foundDoc.uploader.id);
    uploader.reports++;
    uploader.save();
  }
);

app.post("/single_material/:slug/unreport", isLoggedIn, async (req, res) => {
  const foundDoc = await Document.findOne({ slug: req.params.slug });
  foundDoc.reporters.length = 0;
  foundDoc.isHidden = false;
  foundDoc.save();
  let stat = await Stat.findOne({ id: 1 });
  stat.totalReports -= 5;
  stat.save();
  req.flash("success", "Document unreported!");
  res.redirect("back");
});

app.get("/taken-down/:slug", (req, res) => {
  res.render("taken-down.ejs");
});

app.post("/single_material/:slug/reviews", isLoggedIn, async (req, res) => {
  const upvote = req.body.upvote == "on" ? true : false;
  const review = new Review({
    upvote: upvote,
    text: req.body.review,
    author: req.user._id,
  });

  const foundDoc = await Document.findOne({ slug: req.params.slug });
  const docOwner = await User.findById(foundDoc.uploader.id);

  if (review.upvote) {
    console.log("upvote done");
    foundDoc.upvotes++;
    docOwner.upvotes++;
    docOwner.level_points = docOwner.level_points + 5;
    var prev_lvl = docOwner.level;
    var next_lvl = prev_lvl + 1;
    if (docOwner.level_points >= docOwner.check_point + next_lvl * 100) {
      docOwner.check_point = docOwner.check_point + next_lvl * 100;
      docOwner.level++;
    }
  } else {
    console.log("downvote done");
    foundDoc.downvotes++;
  }
  foundDoc.reviews.push(review);
  foundDoc.save();
  const user = await User.findById(req.user._id);

  await review.save();
  await foundDoc.save();
  await user.save();
  await docOwner.save();

  let stat = await Stat.findOne({ id: 1 });
  stat.save();

  console.log(review);
  req.flash("success", "Review submitted successfully. You earned 5 points!");
  res.jsonp({ result: "success" });
});





app.post("/single_material/:slug/suggestions", isLoggedIn, async (req, res) => {
  const suggestion = new Review({
    text: req.body.text,
    author: req.user._id,
  });

  await suggestion.save();

  const foundDoc = await Document.findOne({ slug: req.params.slug });

  if (req.body.subExpert && req.body.subExpert == "on") {
    //send notifications to the respective subject experts

    let subject = foundDoc.subject;
    let stat = await Stat.findOne({ id: 1 }).populate({
      path: "subjects",
      populate: {
        path: "experts",
      },
    });

    const foundUser = await User.findById(req.user._id);

    const index = stat.subjects.findIndex((sub) => {
      return subject == sub.subjectName;
    });

    if (index != -1) {
      stat.subjects[index].experts.forEach(async (expert) => {
        let newNotification = {
          username: foundUser.username,
          documentId: foundDoc.slug,
          message: "has asked you to review a suggestion",
        };
        let notification = await Notification.create(newNotification);
        expert.notifications.push(notification);
        await expert.save();
      });
    }
  }

  foundDoc.suggestions.push(suggestion);
  await foundDoc.save();

  req.flash("success", "Suggestion submitted successfully!");
  res.redirect("/single_material/" + req.params.slug);
});

app.get("/upload", isLoggedIn, (req, res) => {
  res.render("upload.ejs", {
    courses,
    subjects,
  });
});

app.get("/users/:user_id", async (req, res) => {
  try {
    foundUser = await User.findById(req.params.user_id);
    console.log(foundUser);
    if (!foundUser) {
      req.flash("danger", "No such user found");
      return res.redirect("back");
    } else {
      Document.find()
        .where("uploader.id")
        .equals(foundUser.id)
        .exec(function (err, docs) {
          if (err) {
            console.log(err);
          } else {
            res.render("profile.ejs", {
              docs: docs,
              user: foundUser,
            });
          }
        });
    }
  } catch (error) {
    console.error(error);
  }
});

app.get("/landing", (req, res) => {
  res.render("landing.ejs");
});

// app.get("/signup", (req, res) => {
//   res.render("signup.ejs");
// });

app.get("/leaderboard", isLoggedIn, async (req, res) => {
  console.log("hi inside lead");
  console.log(User);

  const logged_in_user = await User.findById(req.user._id);
  const users = await User.find().sort({ level_points: -1 }).limit(20);

  function checkAdult(user) {
    console.log(user.username);
    return user.username === logged_in_user.username;
  }

  const logged_in_rank = users.findIndex(checkAdult);

  res.render("leaderboard.ejs", {
    users: users,
    logged_in_user: logged_in_user,
    logged_in_rank: logged_in_rank,
  });
  // allUsers = User.find({}, function (err, users) {
  //   users.sort({level_points:-1})
  //   console.log("abcddddd" + users.length);
  //   res.render("leaderboard.ejs", {
  //     users: users,
  //   });
  // });
});

app.get("/:userId/getFollowers", async (req, res) => {
  console.log("hi");
  const user = await User.findById(req.params.userId, "followers").populate(
    "followers",
    ["profilePic", "fullname"]
  );
  res.send(user);
});

app.post("/register", async (req, res) => {
  try {
    const { fullname, university, username, password } = req.body;

    req.checkBody("fullname", "Name is required").notEmpty();
    req.checkBody("university", "University is required").notEmpty();
    req.checkBody("username", "Enter a valid Email-id").isEmail();
    // req
    //   .checkBody("password", "password must be of minimum 6 characters")
    //   .isLength({ min: 6 });
    req.checkBody("cpwd", "Passwords do not match").equals(req.body.password);
    console.log(fullname, university, username, password);

    let errors = req.validationErrors();
    if (errors) {
      req.flash("danger", errors[0].msg);
      res.redirect("back");
    } else {
      const user = new User({
        username: username,
        usernameToken: crypto.randomBytes(64).toString("hex"),
        isVerified: false,
        fullname: fullname,
        university: university,
      });
      const registedUser = await User.register(user, password);
      console.log(registedUser);

      const secret = JWT_SECRET;
      const payload = {
        username: user.username,
      };
      const token = jwt.sign(payload, secret, { expiresIn: "15m" });
      const link = `http://localhost:3000/verify-email/?token=${user.usernameToken}`;
      req.flash(
        "success",
        "You are now registered! Please verify your account through mail."
      );
      console.log(link);
      // sendverifyMail(username,link).then(result=>console.log("Email sent....",result));
      let stat = await Stat.findOne({ id: 1 });
      stat.totalUsers++;
      stat.save();
      res.redirect("/results/upvotes/1");
    }
  } catch (error) {
    console.log(error);
    req.flash("danger", "Email is already registered!");
    res.redirect("back");
  }
});

//Email verification route
app.get("/verify-email", async (req, res, next) => {
  try {
    const user = await User.findOne({ usernameToken: req.query.token });
    if (!user) {
      req.flash(
        "danger",
        "Token is invalid! Please contact us for assistance."
      );
      return res.redirect("/results/upvotes/1");
    }
    user.usernameToken = null;
    user.isVerified = true;
    await user.save();
    req.flash("success", "Email verified successfully!");
    res.redirect("/results/upvotes/1");
  } catch (error) {
    console.log(error);
    req.flash("danger", "Token is invalid! Please contact us for assistance.");
    res.redirect("/results/upvotes/1");
  }
});

app.post("/login", isVerified, isNotBanned, (req, res, next) => {
  passport.authenticate("local", {
    failureRedirect: "back",
    successRedirect: "back",
    failureFlash: true,
    successFlash: "Welcome to EduConnect " + req.body.username + "!",
  })(req, res, next);
});

// User.findById("60e586964d255030787aec55", function (err, user) {
//   user.role = "admin";
//   user.save();
// });

//Logout
app.get("/logout", (req, res) => {
  req.logout();
  req.flash("success", "Logged Out Successfully.");
  res.redirect("/results/upvotes/1");
});

//forgot and reset password
app.get("/forgot-password", (req, res) => {
  res.render("forgot-password");
});

app.post("/forgot-password", (req, res) => {
  (async () => {
    const { email } = req.body;
    try {
      let foundUser = await User.findOne({ username: email });
      if (foundUser) {
        const secret = JWT_SECRET;
        const payload = {
          email: foundUser.username,
        };
        const token = jwt.sign(payload, secret, { expiresIn: "15m" });
        const link = `http://localhost:3000/reset-password/${token}`;
        req.flash("success", "Password reset link sent!");
        console.log(link);
        sendMail(email, link).then((result) =>
          console.log("Email sent....", result)
        );
        res.redirect("/results/upvotes/1");
      } else {
        req.flash("danger", "That email id is not registered!");
        return res.redirect("/results/upvotes/1");
      }
    } catch (error) {
      console.log(error);
    }
  })();
});

app.get("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  try {
    const secret = JWT_SECRET;
    const payload = jwt.verify(token, secret);
    const foundUser = await User.findOne({ username: payload.email });
    if (!foundUser) {
      req.flash("danger", "User not found!");
      return res.redirect("/results/upvotes/1");
    }
    res.render("reset-password.ejs", { token });
  } catch (error) {
    console.log(error.message);
    res.send(error.message);
  }
});

app.post("/reset-password/:token", (req, res) => {
  (async () => {
    const { token } = req.params;
    try {
      const secret = JWT_SECRET;
      const payload = jwt.verify(token, secret);
      const foundUser = await User.findOne({ username: payload.email });
      if (!foundUser) {
        req.flash("danger", "User not found!");
        return res.redirect("/results/upvotes/1");
      }

      const { new_password, confirm_password } = req.body;
      if (new_password.length > 0 && new_password === confirm_password) {
        await foundUser.setPassword(new_password);
        await foundUser.save();
        req.flash("success", "Password has been reset successfully!");
        res.redirect("/results/upvotes/1");
      } else {
        req.flash("danger", "Oops! Passwords do not match!");
        return res.redirect("back");
      }
    } catch (error) {
      console.log(error.message);
      res.send(error.message);
    }
  })();
});

//follow a user
app.get("/users/:userId/follow", isLoggedIn, async (req, res) => {
  const user = await User.findById(req.params.userId);
  console.log(user);
  if (!user) {
    req.flash("danger", "User not found!");
    return res.redirect("back");
  }
  user.followers.push(req.user._id);
  user.followerCount++;
  user.level_points = user.level_points + 5;
  var prev_lvl = user.level;
  var next_lvl = prev_lvl + 1;
  if (user.level_points >= user.check_point + next_lvl * 100) {
    user.check_point = user.check_point + next_lvl * 100;
    user.level++;
  }

  req.flash("success", "You started following " + user.fullname + ".");
  user.save();

  res.redirect("back");
});

//unfollow a user
app.get("/users/:userId/unfollow", isLoggedIn, async (req, res) => {
  const user = await User.findById(req.params.userId);
  console.log(user);
  if (!user) {
    req.flash("danger", "User not found!");
    return res.redirect("back");
  }
  let i = 0;
  while (i < user.followers.length) {
    if (user.followers[i].equals(req.user._id)) {
      break;
    }
    i++;
  }
  if (i > -1) {
    user.followers.splice(i, 1);
  }
  user.followerCount--;
  user.level_points = user.level_points - 5;
  if (user.level_points < user.check_point) {
    user.check_point = user.check_point - 100 * user.level;
    user.level--;
  }
  user.save();
  req.flash("success", `You unfollowed ${user.fullname}.`);
  res.redirect("back");
});

// delete notification if it has been read(clicked)
app.get("/notification/:notificationId", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let noti = await Notification.findByIdAndDelete(req.params.notificationId);
    let i = 0;
    while (i < user.notifications.length) {
      if (user.notifications[i].equals(req.params.notificationId)) {
        break;
      }
      i++;
    }
    if (i > -1) {
      user.notifications.splice(i, 1);
    }
    user.save();
    return res.redirect(`/single_material/${noti.documentId}`);
  } catch (error) {
    console.log(error.message);
  }
});

// Stat.create({ id: 1 });

app.get("/admin/statistics", isAdmin, async (req, res) => {
  const stats = await Stat.findOne({ id: 1 });
  res.render("adminStats.ejs", { stats });
});

app.get("/admin/users", isAdmin, async (req, res) => {
  const users = await User.find({});
  res.render("adminUsers.ejs", { users });
});

app.get("/admin/allDocuments", isAdmin, async (req, res) => {
  const docs = await Document.find({});
  res.render("adminDocs.ejs", { docs });
});

app.get("/admin/reportedDocuments", isAdmin, async (req, res) => {
  const docs = await Document.find({ isHidden: true });
  res.render("adminreportedDocs.ejs", { docs });
});

app.get("/admin/requests", isAdmin, async (req, res) => {
  const requests = await Request.find().populate("requester", "fullname");
  console.log(requests);
  res.render("adminRequests.ejs", { requests });
});

app.post("/users/:userId/ban", isAdmin, async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (user.isBanned) {
    user.isBanned = false;
    req.flash("success", `${user.fullname} has been unbanned!`);
  } else {
    user.isBanned = true;
    req.flash("danger", `${user.fullname} has been banned!`);
  }
  await user.save();
  res.redirect("/admin/Users");
});

app.post("/users/:userId/promote", isAdmin, async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (user.role !== "moderator") {
    user.role = "moderator";
    req.flash(
      "success",
      `${user.fullname} has been promoted to a moderator role!`
    );
  } else {
    user.role = "student";
    req.flash(
      "danger",
      `${user.fullname} has been demoted from moderator role!`
    );
  }
  await user.save();
  res.redirect("/admin/Users");
});

app.get("/undefined", (req, res) => {
  req.flash("danger", "Please enter all fields.");
  res.redirect("/upload");
});

// docs = await Document.find({
//   $or: [
//     { university: { $regex: new RegExp(keyword, "i") } },
//     { course: { $regex: new RegExp(keyword, "i") } },
//     { title: { $regex: new RegExp(keyword, "i") } },
//     { subject: { $regex: new RegExp(keyword, "i") } },
//   ],
// });

app.get("/autocomplete", function (req, res, next) {
  var regex = new RegExp(req.query["term"], "i");

  var DocFinder = Document.find({
    $or: [
      { title: regex },
      { title: 1 },
      { university: regex },
      { university: 1 },
      { subject: regex },
      { subject: 1 },
      { course: regex },
      { course: 1 },
    ],
  })
    .sort({ updated_at: -1 })
    .sort({ created_at: -1 })
    .limit(10);

  DocFinder.exec(function (err, data) {
    var result = [];
    if (!err) {
      if (data && data.length && data.length > 0) {
        data.forEach((doc) => {
          let obj = {
            id: doc.slug,
            label:
              "subject: " +
              doc.subject +
              ", Title: " +
              doc.title +
              ", University: " +
              doc.university +
              ", Course: " +
              doc.course,
            value: doc.subject,
          };
          result.push(obj);
        });
      }

      res.jsonp(result);
    }
  });
});

app.get("/autocompleteTag", function (req, res, next) {
  var regex = new RegExp(req.query["term"], "i");

  var UserFinder = User.find({ username: regex }, { username: 1 })
    .sort({ updated_at: -1 })
    .sort({ created_at: -1 })
    .limit(10);

  UserFinder.exec(function (err, data) {
    var result = [];
    if (!err) {
      if (data && data.length && data.length > 0) {
        data.forEach((user) => {
          let obj = {
            id: user.id,
            label: user.username,
          };
          result.push(obj);
        });
      }
      // console.log(result);
      res.jsonp(result);
    }
  });
});

app.get("/autocompleteUniversity", function (req, res, next) {
  var regex = new RegExp(req.query["term"], "i");

  var DocFinder = Document.find({
    $or: [{ university: regex }, { university: 1 }],
  })
    .sort({ updated_at: -1 })
    .sort({ created_at: -1 })
    .limit(10);

  DocFinder.exec(function (err, data) {
    var result = [];
    if (!err) {
      if (data && data.length && data.length > 0) {
        data.forEach((doc) => {
          let obj = {
            id: doc.slug,
            label: doc.university,
          };
          result.push(obj);
        });
      }

      res.jsonp(result);
    }
  });
});

app.get("/autocompleteCourse", function (req, res, next) {
  var regex = new RegExp(req.query["term"], "i");

  var DocFinder = Document.find({
    $or: [{ course: regex }, { course: 1 }],
  })
    .sort({ updated_at: -1 })
    .sort({ created_at: -1 })
    .limit(10);

  DocFinder.exec(function (err, data) {
    var result = [];
    if (!err) {
      if (data && data.length && data.length > 0) {
        data.forEach((doc) => {
          let obj = {
            id: doc.slug,
            label: doc.course,
          };
          result.push(obj);
        });
      }

      res.jsonp(result);
    }
  });
});

app.post("/single_material/:slug/reply", isLoggedIn, async (req, res) => {
  let newReply = {
    reply: req.body.reply,
    author_reply: req.user._id,
  };

  let reply = await Reply.create(newReply);
  // console.log("a " + req.body.reply);
  // console.log("b " + req.body.comment_id);
  // console.log("c " + req.user._id);
  const req_doc = await Document.findOne({ slug: req.params.slug });
  console.log(req_doc);
  const req_review = await Review.findById(req.body.comment_id);
  console.log(req_review);
  req_review.replies.push(reply);
  await req_review.save();
  let newNotification = {
    username: req.user.username,
    documentId: req.params.slug,
    message: "Replied on your comment",
  };

  let notification = await Notification.create(newNotification);
  let comment_owner = await User.findById(req.body.comment_user_id);
  comment_owner.notifications.push(notification);
  await comment_owner.save();
  // follower.notifications.push(notification);
  // await follower.save();
  console.log(notification);
  console.log(comment_owner);
  //console.log(req_doc);
  //console.log(req_review);
  req.flash("success", "Replied to a comment.");
  res.jsonp({ result: "success" });
});

app.get("/subject-expert", isLoggedIn, (req, res) => {
  res.render("teacher-form.ejs", { subjects });
});

app.post("/subject-expert", isLoggedIn, async (req, res) => {
  if (!req.body.subjects) {
    req.flash("danger", "Please select atleast 1 subject!");
    return res.redirect("back");
  }
  let request = new Request({
    requester: req.user._id,
    subjects: req.body.subjects,
  });
  request.save();
  console.log(request);
  req.flash("success", "Request has been sent to admin.");
  res.redirect("back");
});

app.get("/subject-expert/:requestId/:requesterId/accept", async (req, res) => {
  let request = await Request.findById(req.params.requestId);
  await User.findOneAndUpdate(
    { _id: req.params.requesterId },
    {
      $set: { subjects: request.subjects, role: "teacher" },
    }
  );

  //add approved expert id to respective subjects in stat model
  let stat = await Stat.findOne({ id: 1 });
  request.subjects.forEach((sub) => {
    console.log(sub);
    const index = stat.subjects.findIndex((subject) => {
      return subject.subjectName == sub;
    });
    console.log(index);
    if (index != -1) {
      stat.subjects[index].experts.push(req.params.requesterId);
    } else {
      stat.subjects.push({
        subjectName: sub,
        experts: [req.params.requesterId],
      });
    }
  });
  await stat.save();

  await Request.deleteOne({ _id: req.params.requestId });
  req.flash("success", "Request Accepted.");
  res.redirect("back");
});

app.get(
  "/subject-expert/:requestId/:requesterId/reject",
  isAdmin,
  async (req, res) => {
    await Request.deleteOne({ _id: req.params.requestId });
    req.flash("danger", "Request Rejected.");
    res.redirect("back");
  }
);

app.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/results/upvotes/1" }),
  function (req, res) {
    res.redirect("/results/upvotes/1");
  }
);

app.post("/uploadAvatar", isLoggedIn, async (req, res) => {
  console.log("Hiiii");
  req_user = await User.findById(req.user._id);
  var img_src = req.body.avatarsrc;
  req_user.profilePic = img_src;
  req_user.save();
  console.log(img_src);
  res.redirect("back");
});

// try {
//   await mongoose.connect(dbUrl, {
//     useUnifiedTopology: true,
//     useNewUrlParser: true,
//     useFindAndModify: false,
//     useCreateIndex: true,
//   });
//   console.log("DATABASE CONNECTED");
// } catch (err) {
//   console.error(err.message);
//   process.exit(1);
// }


// app.get("/watermark", (req, res) => {
  
// const { PDFNet } = require("@pdftron/pdfnet-node");
//   //const { filename, watermark } = req.query;
//   PDFNet.initialize();
//   const filename = "abcd2";
//   const watermark = "Somaiya";
//   console.log(__dirname);
  
//   const inputPath =path.resolve(
//     __dirname +
//     `/downloads/${filename}.pdf`
//   );
//   const outputPath = path.resolve(
//     __dirname +
//     `/downloads/${filename}4_watermarked.pdf`
//   );

   
//   console.log(inputPath, outputPath);
//   const watermarkPDF = async () => {
//     try{

//       console.log("abcd2");
//     const pdfdoc = await PDFNet.PDFDoc.createFromUFilePath(inputPath);
//     console.log("abcd4");
//     await pdfdoc.initSecurityHandler();
    
//     const stamper = await PDFNet.Stamper.create(
//       PDFNet.Stamper.SizeType.e_relative_scale,
//       0.5,
//       0.5
//     );

//     console.log("abcd2"); 

//     stamper.setAlignment(
//       PDFNet.Stamper.HorizontalAlignment.e_horizontal_center,
//       PDFNet.Stamper.VerticalAlignment.e_vertical_center
//     );

//     const redColorPt = await PDFNet.ColorPt.init(1, 0, 0);
//     stamper.setFontColor(redColorPt);
//     const pgSet = await PDFNet.PageSet.createRange(
//       1,
//       await pdfdoc.getPageCount()
//     );

//     await stamper.stampText(pdfdoc, watermark, pgSet);

//     await pdfdoc.save(outputPath, PDFNet.SDFDoc.SaveOptions.e_linearized);
  

//     } catch (err){
//       console.log("hello");
//       console.log(err);
//     }
//   };  

//   PDFNet.runWithCleanup( watermarkPDF) // you can add the key to PDFNet.runWithCleanup(main, process.env.PDFTRONKEY)
//     .then(() => {
//        PDFNet.shutdown();
//        res.redirect("back");
//       // fs.readFile(outputPath, (err, data) => {
//       //   if (err) {
//       //     res.statusCode = 500;
//       //     res.end(`Error getting the file: ${err}.`);
//       //   } else {
//       //     const ext = path.parse(outputPath).ext;
//       //    res.setHeader("Content-type", mime_Type[ext] || "text/plain");
//       //    res.send(data);
//       //    //res.jsonp({"Result":"Success"});
//       //   //res.writeHead(200, { 'Content-Type': 'application/json' });
//       //   //res.write(JSON.stringify(data));
//       //   //res.send(data);
//       //   }
//       // });
//     })
//     .catch((error) => {
//       res.statusCode = 500;
//       console.log("hi");
//       res.end(error);
//     });
    
// });

// Error Page 404
// app.get("*", (req, res) => {
//   res.render("404_page.ejs");
// });

const port = 3000;

app.listen(port, () => {
  console.log(`Serving on port ${port}`);
});
