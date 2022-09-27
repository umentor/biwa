const path = require("path");
const BiwaHtmlWebpackPlugin = require("./code/javascripts/layouts");

module.exports = {
  devtool: "source-map",
  entry: "./code/javascripts/application.js",
  mode: process.env.NODE_ENV || "development",
  output: {
    filename: "javascripts/application.js",
    path: path.resolve(__dirname, "publish")
  },
  plugins: [
    new BiwaHtmlWebpackPlugin({
      source: "./code/html",
      layouts: "layouts",
      partials: "partials"
    })
  ],
  watchOptions: {
    ignored: /node_modules/
  }
};
