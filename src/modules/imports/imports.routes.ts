import { Router } from "express";
import multer from "multer";
import { testStorageUpload, handleUpload, confirmImport } from "./imports.controller";

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || // .xlsx
      file.mimetype === "application/vnd.ms-excel" || // .xls
      file.mimetype === "text/csv" // .csv
    ) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only Excel and CSV files are allowed."));
    }
  }
});

/**
 * @swagger
 * tags:
 *   name: Imports
 *   description: Import Excel and CSV files for activity data
 */

/**
 * @swagger
 * /imports/test:
 *   post:
 *     summary: Test storage upload
 *     tags: [Imports]
 *     responses:
 *       200:
 *         description: Storage test successful
 */
router.post("/test", testStorageUpload);

/**
 * @swagger
 * /imports/upload:
 *   post:
 *     summary: Upload and parse an Excel/CSV file for preview
 *     tags: [Imports]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               universityId:
 *                 type: string
 *               reportingPeriodId:
 *                 type: string
 *     responses:
 *       200:
 *         description: File uploaded, parsed, and validated for preview
 *       400:
 *         description: Invalid file or missing required fields
 */
router.post("/upload", upload.single("file"), handleUpload);

/**
 * @swagger
 * /imports/{id}/confirm:
 *   post:
 *     summary: Confirm the import preview and create DRAFT activity data
 *     tags: [Imports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The Document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               universityId:
 *                 type: string
 *               reportingPeriodId:
 *                 type: string
 *               validRows:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Import confirmed and DRAFT activity data created
 *       400:
 *         description: Missing documentId, validRows, universityId, or reportingPeriodId
 *       403:
 *         description: Access denied due to university isolation mismatch
 *       404:
 *         description: Document not found
 */
router.post("/:id/confirm", confirmImport);

export const importsRouter = router;
