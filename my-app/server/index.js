const { Server } = require("socket.io");
const PORT = process.env.PORT;
const io = new Server(PORT || 3009, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const users = new Set();

io.on("connection", (socket) => {
  console.log("User joined:", socket.id);

  socket.on("join", (name) => {
    if (name && !users.has(name)) {
      socket.name = name;
      users.add(name);
      socket.join("chat");
      socket.emit("name accepted", name);
      io.emit("user joined", name);
      io.emit("user list", Array.from(users));
    } else {
      socket.emit("name rejected");
    }
  });

  io.on("chat message", (message) => {
    if (socket.name && message) {
      io.broadcast.to("chat").emit("chat message", {
        name: socket.name,
        message: message,
      });
    }
  });

  socket.on("personal message", ({ to, message }) => {
    if (socket.name && to && message) {
      if (users.has(to)) {
        io.to(to).emit("personal message", {
          name: socket.name,
          message: message,
        });
      }
    }
  });

  socket.on("disconnect", () => {
    if (socket.name) {
      users.delete(socket.name);
      io.emit("user left", socket.name);
      io.emit("user list", Array.from(users));
    }
    console.log("User left:", socket.id);
  });
});
