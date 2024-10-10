import axios from "axios";

const getThreat = async (
  accessToken: string,
  nextCursor?: string
): Promise<any> => {
  try {
    return axios
      .get(`${process.env.API_ENDPOINT}/threats`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          cursor: nextCursor,
          resolved: false,
        },
      })
      .then((res) => {
        return res;
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (e) {
    console.log(e);
  }
};

const getAllThreatsRecursive = async (
  token: any,
  {
    data: {
      data,
      pagination: { nextCursor },
    },
  }: any
): Promise<any> => {
  if (!nextCursor) return data;
  return data.concat(
    await getAllThreatsRecursive(token, await getThreat(token, nextCursor))
  );
};

const getAllThreats = async (accessToken: string) => {
  return await getAllThreatsRecursive(
    accessToken,
    await getThreat(accessToken)
  );
};

export { getThreat, getAllThreats };
