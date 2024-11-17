const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Customer = require("./models/customer");
const Order = require('./models/order');

dotenv.config({ path: "./connect.env" });

// Connect to MongoDB
const clientOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
};

mongoose
  .connect(process.env.MONGO_URI, clientOptions)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// Helper functions to generate random data
const randomName = () => {
  const names = ["John", "Jane", "Alice", "Bob", "Charlie", "Emma", "Liam", "Sophia", "Mason", "Olivia" , "Rahul" , "Sumit" , "Arushi" , "Vinayak" , "Priyansh" , "Julie", "Emily", "Serena", "Mukesh", "Sanya", "Devanshi", "Akarsh", "Ishita", "Rishabh", "Ishika", "Jennifer","Caroline","Paul"];
  const surnames = ["Smith", "Doe", "Brown", "Johnson", "Lee", "Walker", "Davis", "Garcia", "Harris", "Martinez","Dhingra","Thakur","Upadhya","Agarwal","Miller","Shelby","Ford","Ambani","Verma","Abrol","Pandey","Kohli","Jain","Sandler","Geller","Greene","Perry"];
  return `${names[Math.floor(Math.random() * names.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}`;
};

const randomEmail = (name) => {
  const domains = ["gmail.com", "yahoo.com", "hotmail.com", "example.com"];
  return `${name.split(" ").join(".").toLowerCase()}@${domains[Math.floor(Math.random() * domains.length)]}`;
};

const randomPhone = () => {
  return `9${Math.floor(1000000000 + Math.random() * 9000000000)}`;
};

const randomDate = () => {
  const start = new Date();
  const end = new Date(start);
  start.setMonth(start.getMonth() - 3); // 3 months back
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const randomSpending = () => Math.floor(Math.random() * 5000) + 100; // Between 100 and 5000

const randomVisits = () => Math.floor(Math.random() * 10) + 1; // Between 1 and 10

// Create 100 Customers
const createCustomers = () => {
  const customers = [];
  for (let i = 0; i < 100; i++) {
    const name = randomName();
    customers.push({
      name,
      email: randomEmail(name),
      phone: randomPhone(),
      totalSpending: randomSpending(),
      visits: randomVisits(),
      lastVisit: randomDate(),
    });
  }
  return Customer.insertMany(customers);
};

// Create 100 Orders
const createOrders = async () => {
  const customers = await Customer.find();
  const orders = [];
  for (let i = 0; i < 100; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    orders.push({
      customerId: customer._id,
      orderAmount: randomSpending(),
    });
  }
  return Order.insertMany(orders);
};

// Execute the script
(async () => {
  try {
    // console.log("Creating customers...");
    // await createCustomers();
    // console.log("Customers created successfully!");

    console.log("Creating orders...");
    await createOrders();
    console.log("Orders created successfully!");

    mongoose.connection.close();
    console.log("Database connection closed.");
  } catch (error) {
    console.error("Error:", error);
    mongoose.connection.close();
  }
})();
