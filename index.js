// sftp-server/index.js

const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const SFTPClient = require("ssh2-sftp-client");
const fs = require("fs/promises");
const path = require("path");
const puppeteer = require("puppeteer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(fileUpload());
app.use(express.json());

function generateInvoiceHtml(order) {
  return `
   <!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
      position: relative;
      color: #333;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #ddd;
      padding-bottom: 15px;
    }
    
    .logo {
      width: 150px;
      height: auto;
    }
    
    .invoice-title {
      font-size: 24px;
      font-weight: bold;
      text-align: right;
    }
    
    .invoice-number {
      font-size: 16px;
      margin-top: 5px;
      text-align: right;
    }
    
    .company-details {
      text-align: right;
      font-size: 14px;
    }
    
    .details-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    
    .customer-details, .invoice-details {
      width: 45%;
    }
    
    h2 {
      color: #444;
      font-size: 18px;
      margin-bottom: 10px;
      border-bottom: 1px solid #eee;
      padding-bottom: 5px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    th {
      background-color: #f2f2f2;
      padding: 12px 10px;
      border: 1px solid #ddd;
      text-align: left;
    }
    
    td {
      padding: 10px;
      border: 1px solid #ddd;
    }
    
    .right-align {
      text-align: right;
    }
    
    .summary {
      margin-left: auto;
      width: 40%;
    }
    
    .summary table {
      margin-bottom: 0;
    }
    
    .summary table td {
      padding: 5px 10px;
    }
    
    .total-row {
      font-weight: bold;
      background-color: #f9f9f9;
    }
    
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 100px;
      opacity: 0.08;
      z-index: -1;
      color: #666;
      font-weight: bold;
      white-space: nowrap;
    }
    
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 14px;
      text-align: center;
    }
    
    .payment-info {
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="watermark">FOXERGO</div>
  
  <div class="header">
    <div>
      <img src="/assets/images/FOX-BLACK.png" width="200px" alt="Company Logo" class="logo">
    </div>
    <div>
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-number">INV-${order.id}</div>
      <div class="company-details">
        <p>FoxErgo Inc.</p>
        <p>VAT Reg No: GB123456789</p>
      </div>
    </div>
  </div>
  
  <div class="details-section">
    <div class="customer-details">
      <h2>BILL TO</h2>
      <p><strong>${order.customerName}</strong></p>
      <p>123 Customer Street</p>
      <p>City, State, ZIP</p>
      <p>Phone: (555) 123-4567</p>
      <p>Email: customer@example.com</p>
    </div>
    
    <div class="invoice-details">
      <h2>INVOICE DETAILS</h2>
      <p><strong>Invoice Number:</strong> INV-${order.id}</p>
      <p><strong>Date Issued:</strong> April 11, 2025</p>
      <p><strong>Due Date:</strong> May 11, 2025</p>
      <p><strong>Payment Terms:</strong> Net 30</p>
    </div>
  </div>
  
  <h2>ITEMS</h2>
  <table>
    <thead>
      <tr>
        <th>Item Description</th>
        <th>Quantity</th>
        <th>Unit Price</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${order.items
        .map(
          (item) => `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td class="right-align">$${item.price.toFixed(2)}</td>
          <td class="right-align">$${(item.quantity * item.price).toFixed(
            2
          )}</td>
        </tr>`
        )
        .join("")}
    </tbody>
  </table>
  
  <div class="summary">
    <table>
      <tr>
        <td>Subtotal:</td>
        <td class="right-align">$${order.total.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Discount (10%):</td>
        <td class="right-align">-$${(order.total * 0.1).toFixed(2)}</td>
      </tr>
      <tr>
        <td>Shipping:</td>
        <td class="right-align">$15.00</td>
      </tr>
      <tr>
        <td>Tax (8%):</td>
        <td class="right-align">$${(order.total * 0.08).toFixed(2)}</td>
      </tr>
      <tr class="total-row">
        <td><strong>TOTAL:</strong></td>
        <td class="right-align"><strong>$${(order.total * 0.98 + 15).toFixed(
          2
        )}</strong></td>
      </tr>
    </table>
  </div>
  
  <div class="payment-info">
    <h2>PAYMENT INFORMATION</h2>
    <p><strong>Bank Name:</strong> International Bank</p>
    <p><strong>Account Name:</strong> FoxErgo Inc.</p>
    <p><strong>Account Number:</strong> 1234567890</p>
    <p><strong>Routing Number:</strong> 987654321</p>
  </div>
  
  <div class="footer">
    <p>Thank you for your business!</p>
    <p>FoxErgo Inc. | 456 Company Avenue, Business City, ST 12345 | www.foxergo.com | support@foxergo.com | (555) 987-6543</p>
  </div>
</body>
</html>
  `;
}

app.post("/generate-invoice", async (req, res) => {
  try {
    const { order } = req.body;
    if (
      !order ||
      !order.id ||
      !order.customerName ||
      !order.items ||
      !order.total
    ) {
      return res.status(400).json({ message: "Invalid order data" });
    }

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    const html = generateInvoiceHtml(order);
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4" });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order.id}.pdf`
    );
    res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/upload", async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const file = req.files.file;
  const uploadDir = path.join(__dirname, "uploads");
  const tempFilePath = path.join(uploadDir, file.name);

  try {
    await fs.mkdir(uploadDir, { recursive: true });
    await file.mv(tempFilePath);
    await uploadToSFTP(tempFilePath, file.name);
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
      if (closeErr.code === "ECONNRESET") {
        console.warn(
          "Remote SFTP server reset the connection before graceful shutdown. Safe to ignore."
        );
      } else {
        console.error("Error closing SFTP connection:", closeErr);
      }
    }
  }
};

app.listen(PORT, () => console.log(`SFTP server listening on port ${PORT}`));
