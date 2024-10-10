import axios from "axios";

require("dotenv").config();

const createSite = async (site: any, accessToken: string) => {
  const {
    data: { data },
  } = await axios.post(`${process.env.S1_CENTRAL_API_ENDPOINT}/sites`, site, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return data;
};

export { createSite };
