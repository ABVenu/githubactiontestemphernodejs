const mongoose = require("mongoose");
const app = require("./config/index"); // Ensure your server logic is in `server.js`

const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() =>
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  )
  .catch((err) => console.error(err));