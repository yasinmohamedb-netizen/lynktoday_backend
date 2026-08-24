const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ======================================================
// Create Upload Folder if Missing
// ======================================================
const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ======================================================
// Storage Configuration
// ======================================================
const storage = multer.diskStorage({

    destination(req, file, cb) {
        cb(null, uploadDir);
    },

    filename(req, file, cb) {

        const extension = path.extname(file.originalname);

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1000000);

        cb(null, `${uniqueName}${extension}`);

    }

});

// ======================================================
// Allowed File Types
// ======================================================
const allowedMimeTypes = [

    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",

    // PDF
    "application/pdf",

    // Word
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    // Excel
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

];

// ======================================================
// File Filter
// ======================================================
const fileFilter = (req, file, cb) => {

    if (allowedMimeTypes.includes(file.mimetype)) {
        return cb(null, true);
    }

    cb(
        new Error(
            "Unsupported file type. Allowed: JPG, PNG, WEBP, PDF, DOC, DOCX, XLS, XLSX."
        )
    );

};

// ======================================================
// Upload Middleware
// ======================================================
const upload = multer({

    storage,

    fileFilter,

    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB
    }

});

module.exports = upload;