const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("./models/user");
const dotenv = require("dotenv");
dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID, 
      clientSecret: process.env.CLIENT_SECRET, 
      callbackURL: process.env.GOOGLE_CALLBACK_URL, 
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        // Check if user already exists in the database based on the userId
        let user = await User.findOne({ userId: profile.id });

        if (!user) {
          // If user does not exist, create a new user with only userId
          user = new User({
            userId: profile.id,
          });

          await user.save(); // Save the user to the database
        }

        console.log(user);

        return done(null, user); // Pass user data to the next step
      } catch (error) {
        console.error("Error during user authentication:", error);
        return done(error, null); // Handle error in case of issues during user creation
      }
    }
  )
);

// Serialize user to save in session
passport.serializeUser((user, done) => {
  done(null, user.userId); // Save only the userId in the session
  console.log(user, "In serializer");
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findOne({ userId: id });
    done(null, user); // Rehydrate user from the database
    console.log(user, "In deserializer");
  } catch (error) {
    done(error, null); // Handle error if the user is not found
  }
});
