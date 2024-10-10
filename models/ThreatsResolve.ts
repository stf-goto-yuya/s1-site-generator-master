import axios from "axios";

require("dotenv").config();

const getThreatsResolve = async (id: string, accessToken: string) => {
  const {
    data: { data },
  } = await axios.get(
    `${process.env.API_ENDPOINT}/threats-resolve/threat_id/${id}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return data;
};

const getManyThreatsResolveById = async (
  ids: string[],
  accessToken: string
) => {
  const {
    data: { data },
  } = await axios.post(
    `${process.env.API_ENDPOINT}/threats-resolve/many/ids`,
    {
      ids,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return data;
};

export { getThreatsResolve, getManyThreatsResolveById };
