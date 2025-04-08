// sftp-server/index.js

const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const SFTPClient = require("ssh2-sftp-client");
const fs = require("fs/promises");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(fileUpload());

app.post("/upload", async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const file = req.files.file;
  const uploadDir = path.join(__dirname, "uploads");
  const tempFilePath = path.join(uploadDir, file.name);

  try {
    // Ensure uploads directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Save the file temporarily
    await file.mv(tempFilePath);

    // Upload to SFTP
    await uploadToSFTP(tempFilePath, file.name);

    // Delete the temp file
    await fs.unlink(tempFilePath);

    res.json({ message: "File uploaded successfully" });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: error.message });
  }
});

const uploadToSFTP = async (filePath, fileName) => {
  const sftp = new SFTPClient();
  try {
    await sftp.connect({
      host: process.env.SFTP_HOST,
      port: 22,
      username: process.env.SFTP_UN,
      password: process.env.SFTP_PWD,
    });

    const remotePath = `/web/${fileName}`;
    await sftp.put(filePath, remotePath);
    console.log("File uploaded to:", remotePath);
  } catch (err) {
    console.error("SFTP Upload Error:", err);
    throw new Error("SFTP upload failed: " + err.message);
  } finally {
    console.log("Closing SFTP connection...");
    try {
      await sftp.end();
      console.log("SFTP connection closed.");
    } catch (closeErr) {
      if (closeErr.code === 'ECONNRESET') {
        console.warn("Remote SFTP server reset the connection before graceful shutdown. Safe to ignore.");
      } else {
        console.error("Error closing SFTP connection:", closeErr);
      }
    }
  }
  
};

app.listen(PORT, () => console.log(`SFTP server listening on port ${PORT}`));
