const express = require("express");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

const app = express();

// import auth strategy
require("./passportConfig");

app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "dist", "index.html"));
});

dotenv.config();

// Configure CORS FIRST
// app.use(
//   cors({
//     origin: "http://localhost:5173", // React app's URL
//     credentials: true, // Allow sending cookies
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*", // Update if needed for production
    credentials: true, 
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware
app.use(express.json());

// Configure session middleware
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: false, // Changed to false for better security
    cookie: {
      secure: process.env.NODE_ENV === "production", // True in production
      httpOnly: true,
      sameSite: "lax", // Changed from 'none' for better security
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// importing the models
const Customer = require("./models/customer");
const Order = require("./models/order");
const Campaign = require("./models/campaign");
const CommunicationLog = require("./models/communicationLog");
const User = require("./models/user");

// Connect to MongoDB
const clientOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
};

mongoose
  .connect(process.env.MONGO_URI, clientOptions)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// Modified isLoggedIn middleware with better error handling
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "You must be logged in to view this page" });
}

// Basic Route
// app.get("/", (req, res) => {
//   res.send("<a href='/auth/google'>Authenticate With Google</a>");
// });

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

// Callback route after Google login
app.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/failure",
    successRedirect: process.env.FRONTEND_SUCCESS_URL || "http://localhost:5173/home",
  }),
  (req, res) => {
    console.log("User data after Google login:", req.user);
  }
);

// Protected route
app.get("/protected", isLoggedIn, (req, res) => {
  if (req.user) {
    console.log("User found!!", req.user);
    res.json({
      userId: req.user.userId,
    });
  } else {
    res.status(401).json({ error: "User not logged in" });
  }
});

// Auth routes
app.get("/auth/failure", (req, res) => {
  res.status(401).json({ error: "Authentication failed" });
});

app.get("/auth/success", (req, res) => {
  res.json({ message: "Authentication Complete!" });
});

app.get("/api/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy(() => {
      res.clearCookie("connect.sid"); // Replace "connect.sid" with your session cookie name
      res.status(200).json({ message: "bye!" });
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Add to your index.js or routes file for campaigns
app.get("/campaigns/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const campaigns = await Campaign.find({ userId });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: "Error fetching campaigns" });
  }
});

// POST /api/campaigns - Create a new campaign
app.post("/api/campaigns", async (req, res) => {
  try {
    const { name, description, audienceCriteria, userId } = req.body;

    // Validate required fields
    if (!name || !audienceCriteria || !userId) {
      return res
        .status(400)
        .json({ error: "Name, audienceCriteria, and userId are required." });
    }

    // Create and save the campaign
    const campaign = new Campaign({
      name,
      description,
      audienceCriteria,
      userId,
    });

    const savedCampaign = await campaign
      .save()
      .then((data) => console.log(data, "Created a new campaign!!"));
    res.status(201).json(savedCampaign);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create the campaign." });
  }
});

// API to send messages to customers based on campaign and message
app.post("/api/send-messages/:campaignId/:userId", async (req, res) => {
  try {
    const { campaignId } = req.params; // Campaign ID from the route parameter
    const { message } = req.body; // Message from the request body
    const { userId } = req.params; // User ID from the logged-in user (assumes authentication middleware)

    // Validate required fields
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    // Fetch campaign details
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found." });
    }

    const { audienceCriteria } = campaign;

    // Build query for audienceCriteria
    const query = {};
    if (audienceCriteria.totalSpending) {
      query.totalSpending = {
        ...(audienceCriteria.totalSpending.$gte && {
          $gte: parseInt(audienceCriteria.totalSpending.$gte, 10),
        }),
        ...(audienceCriteria.totalSpending.$lte && {
          $lte: parseInt(audienceCriteria.totalSpending.$lte, 10),
        }),
      };
    }
    if (audienceCriteria.visits) {
      query.visits = {
        ...(audienceCriteria.visits.$gte && {
          $gte: parseInt(audienceCriteria.visits.$gte, 10),
        }),
        ...(audienceCriteria.visits.$lte && {
          $lte: parseInt(audienceCriteria.visits.$lte, 10),
        }),
      };
    }

    // Find customers matching the criteria
    const customers = await Customer.find(query);

    if (!customers.length) {
      return res
        .status(404)
        .json({ message: "No customers match the campaign criteria." });
    }

    // Prepare communication logs with random statuses
    let sentCount = 0;
    let failedCount = 0;

    const logs = customers.map((customer) => {
      // Randomize status (80% chance of SENT, 20% chance of FAILED)
      const status = Math.random() < 0.8 ? "SENT" : "FAILED";
      if (status === "SENT") {
        sentCount++;
      } else {
        failedCount++;
      }

      return {
        customerId: customer._id,
        campaignId,
        message,
        status,
        sentAt: new Date(),
        userId,
      };
    });

    const savedLogs = await CommunicationLog.insertMany(logs);

    // Respond with the result
    res.status(201).json({
      message: `Messages sent to customers.`,
      summary: {
        totalCustomers: customers.length,
        sent: sentCount,
        failed: failedCount,
      },
      logs: savedLogs,
    });
  } catch (error) {
    console.error("Error sending messages:", error);
    res.status(500).json({ error: "Failed to send messages." });
  }
});


// GET /api/logs/:userId/:campaignId - Fetch logs for a specific user and campaign
app.get("/api/logs/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate required fields
    if (!userId) {
      return res
        .status(400)
        .json({ error: "Both userId and campaignId are required." });
    }

    // Fetch logs for the specific user and campaign
    const logs = await CommunicationLog.find({ userId });

    if (!logs.length) {
      return res
        .status(404)
        .json({ message: "No logs found for the specified criteria." });
    }

    // Respond with logs
    res.status(200).json({
      message: `Logs retrieved successfully for user ID ${userId}.`,
      logs,
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ error: "Failed to fetch logs." });
  }
});
