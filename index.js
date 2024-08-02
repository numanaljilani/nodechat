const express = require("express");
const app = express();
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");
const bcrypt = require("bcrypt");
const connectDB = require("./db/connect");
const User = require("./model/userModel");
const Message = require("./model/message");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({ secret: "secret", resave: true, saveUninitialized: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

const user = { username: "user", password: "pass" };

app.get("/", (req, res) => {
  res.render("login");
});

// app.get('/', (req, res) => {
//     res.sendFile(__dirname + '/index.html');
//   });
connectDB();
app.post("/register", async (req, res) => {
  const { username, password, userId } = req.body;
  console.log(username, password);
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashedPassword,
      userId,
    });
    res.status(200).json({ data: user });
  } catch (error) {
    res.status(200).json({ data: error.message });
  }
});
app.post("/auth", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    const auth = await bcrypt.compare(password, user.password);
    console.log(auth, "Auth");
    if (auth) {
      req.session.loggedin = true;
      req.session.username = user.username;
      req.session.userId = user.userId;

      res.redirect("/chat");
    } else {
      res.send("Incorrect Username and/or Password!");
    }
  } catch (error) {}
});

app.get("/chat", async(req, res) => {
  if (req.session.loggedin) {
    const messages = await Message.find().limit(20)
    res.render("chat", {
      username: req.session.username,
      userId: req.session.userId,
      messages
    });
  } else {
    res.send("Please login to view this page!");
  }
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("chat message", async (msg) => {
    console.log(msg, "MSG");
    const message = await Message.create({
      message: msg.message,
      userId: msg.username == "fz@chat.com" ? 1 : 2,
    });
    await message.save()
 

    io.emit("chat message",message );
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
