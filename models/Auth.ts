import axios from "axios";

require("dotenv").config();

const getAccessToken = async () => {
  const {
    data: {
      data: { access_token },
    },
  } = await axios.post(`${process.env.S1_CENTRAL_API_ENDPOINT}/auth/login`, {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
  });

  return access_token;
};

export { getAccessToken };
