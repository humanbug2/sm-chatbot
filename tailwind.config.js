/** @type {import('tailwindcss').Config} */
export const content = [
  "./pages/**/*.{js,ts,jsx,tsx}",
  "./components/**/*.{js,ts,jsx,tsx}",
];
export const theme = {
  screens: {
    xs: "601px",
    sm: "800px",
    md: "1025px",
    lg: "1441px",
    xl: "1601px",
  },
  extend: {
    backgroundImage: {
      "text-gradient":
        "linear-gradient(to bottom, #001E96 10%, #005CD9 80%, #008CE3 100%)",
    },
    fontFamily: {
      inter: ["Montserrat", "sans-serif"],
    },
  },
};
export const plugins = [];
