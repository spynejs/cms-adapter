module.exports = {
  content: ["http://localhost:8078/", "./src/app/components/**/*.{html,mustache,js}", "./node_modules/tw-elements/dist/js/**/*.js"],
  theme: {
    extend: {},
  },
  plugins: [require('tw-elements/dist/plugin')],
}
