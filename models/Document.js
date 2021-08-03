  const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema({
  university: {
    type: String,
    required: true,
  },
  course: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  branch: {
    type: String,
    required: true,
    default: "",
  },
  category: {
    type: String,
    required: true,
  },
  year: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    unique: true,
  },
  upvotes: {
    type: Number,
    default: 0,
  },
  downvotes: {
    type: Number,
    default: 0,
  },
  num_pages: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  reporters: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  isHidden: {
    type: Boolean,
    default: false,
  },
  driveId: String,
  mimeType: String,
  fileName: String,
  // previewPics : [String],
  uploader: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    username: String,
  },
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  suggestions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  downloads: {
    type: Number,
    default: 0,
  },
  recentDownloads: {
    type: Number,
    default: 0,
  },
  thumbnailPic: {
    type: String,
    default: "thumbnail.jpg",
  },
});

// add a slug before the item gets saved to the database
DocumentSchema.pre("save", async function (next) {
  try {
    if (this.isNew || this.isModified("title")) {
      this.slug = await generateUniqueSlug(this._id, this.title);
    }
    next();
  } catch (err) {
    console.log(err);
  }
});

const Document = mongoose.model("Document", DocumentSchema);
module.exports = Document;

async function generateUniqueSlug(docId, docTitle, slug) {
  try {
    if (!slug) {
      slug = slugify(docTitle);
    }
    var doc = await Document.findOne({ slug: slug });
    if (!doc || doc._id.equals(docId)) {
      return slug;
    }
    var newSlug = slugify(docTitle);
    return await generateUniqueSlug(docId, docTitle, newSlug);
  } catch (err) {
    console.log(err);
  }
}

function slugify(text) {
  var slug = text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, "") // Trim - from end of text
    .substring(0, 75); // Trim at 75 characters

  return slug + "-" + Math.floor(1000 + Math.random() * 9000);
}
