const { analyzeUser } = require("../services/insightEngine");

module.exports = function (io) {
  io.on("connection", (socket) => {
    console.log("User connected");

    socket.on("requestInsight", async (userId) => {
      const analysis = await analyzeUser(userId);
      socket.emit("insightTip", analysis.tip);
    });
  });
};
