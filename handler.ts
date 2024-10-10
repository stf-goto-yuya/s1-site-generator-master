import "source-map-support/register";
import { getAccessToken } from "./models/Auth";
import axios from "axios";

require("dotenv").config();
const Handlebars = require("handlebars");
const fs = require("fs");
const moment = require("moment");

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// mail send2
export const run = async (event, _context) => {
  const ADMIN_ROLE_ID = '796942796483806260'
  let response = null;
  const accessToken = await getAccessToken();
  const {
    data,
    dataWithoutAdmin,
    mailData,
    meta
  }: any = JSON.parse(event.body);

  try {
    if (meta.isCustomerAdminNeeded) {
      response = await axios.post(
        `${process.env.S1_CENTRAL_API_ENDPOINT}/sites/with-admin`,
        { data },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data?.data?.errors) {
        return {
          statusCode: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify(
            {
              message: "FAILED",
              errors: response.data.data.errors,
            },
            null,
            2
          ),
        };
      }
    } else {
      response = await axios.post(
        `${process.env.S1_CENTRAL_API_ENDPOINT}/sites`,
        { data: dataWithoutAdmin },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data?.data?.errors) {
        return {
          statusCode: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify(
            {
              message: "FAILED",
              errors: response.data.data.errors,
            },
            null,
            2
          ),
        };
      }
    }

    if (meta.isPartnerAdminNeeded) {
      const pUsers = meta.partnerAdminEmails.map(({ email }) => {
        return axios.get(`${process.env.S1_CENTRAL_API_ENDPOINT}/users/s1/${email}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      })

      const targetS1Users = await Promise.all(pUsers)

      const updateRolesData = targetS1Users.map(({ data }) => {
        const { id, scope, scopeRoles } = data

        const addedScopeRoles = scopeRoles.concat({
          id: response.data.data.id, roleId: ADMIN_ROLE_ID
        })

        return {
            id,
            scope,
            scopeRoles: addedScopeRoles,
        }
      })

      for (const user of updateRolesData) {
        const { id, ...rest } = user

        try {
          await axios.put(`${process.env.S1_CENTRAL_API_ENDPOINT}/users/s1/${id}`,
            rest,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          )
        } catch (err) {
          console.log(err)
        }
      }
    }

    const textMail = fs.readFileSync("./templates/trial_text.hbs", "utf8");
    const htmlMail = fs.readFileSync("./templates/trial_html.hbs", "utf8");

    const textTemplate = Handlebars.compile(textMail);
    const htmlTemplate = Handlebars.compile(htmlMail);

    const injectData = {
      companyName: mailData.company,
      siteName: data.name,
      siteId: response.data.data.id,
      createdOn: moment().format("YYYY/MM/DD"),
      createdAt: moment().format("YYYY/MM/DD h:mm:ss a"),
      numberOfLicenses: data.totalLicenses,
      registerToken: response.data.data.registrationToken,
      email: data.user.email,
      siteType: data.siteType,
      sku: data.sku,
      expiration: moment(data.expiration).format("YYYY/MM/DD"),
      isCustomerAdminNeeded: meta.isCustomerAdminNeeded,
      isPaidType: meta.isPaidType,
      packages: [
        {
          name: "",
          url: "https://totm1.sharepoint.com/:f:/s/sales/EqOBSX-HoTJCi68VnpbqV0IBj1_UAuE5ZdllLXUFvHuY9A?e=l4q64x",
        },
      ],
    };

    const textBody = textTemplate(injectData);
    const htmlBody = htmlTemplate(injectData);

    const msg = {
      to: mailData.to,
      cc: process.env.ADMIN_USERNAME,
      bcc: process.env.ADMIN_BCC_EMAIL.split(",").filter(email => email !== mailData.to),
      from: process.env.ADMIN_EMAIL_ADDR,
      subject: `${process.env.EMAIL_SUBJECT}【${mailData.company}】`,
      text: textBody,
      html: htmlBody,
    };

    await sgMail.send(msg);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(
        {
          message: "SUCCESS",
          response: response.data.data,
        },
        null,
        2
      ),
    };
  } catch (err) {
    console.log(err)

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(
        {
          message: "FAILED",
          err
        },
        null,
        2
      ),
    };
  }
};
