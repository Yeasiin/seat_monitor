import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import { sendTelegram } from "./monitor";
import { env } from "./utils";

const API_URL =
  "http://app7.nu.edu.bd/nu-web/msapplication/saveApplicationFormPrivatePreli";

export const handleApply = async (courseId = "2681") => {
  const data = new FormData();
  data.append("coursePreference", courseId);
  data.append("formType", "application");
  data.append("ApplyDegree", "Y");

  env.isFemale && data.append("applicantGenderChange", "F"); // female candidate need to specify

  data.append("honsDegree1", "Degree Pass");
  data.append("honsRoll1", env.roll);
  data.append("honsRegno1", env.reg);
  data.append("honsPassingYear1", "2022");
  data.append("honsRegnoHidden1", env.reg);
  data.append("applicantDoBChange", env.dob);
  data.append("college", "4306");
  data.append("mobileNo", env.mobile);
  data.append("emailNo", env.email);

  const img = fs.createReadStream("./file/image.jpg");
  const pdf = fs.createReadStream(`./file/commit.pdf`);

  data.append("fileUpload", img);
  data.append("agreementFileUpload", pdf);
  const res = await axios
    .post(API_URL, data)
    .then((dat) => {
      sendTelegram(dat.data)
        .then((d) => console.log("message sent successfully"))
        .catch((e) => console.log("Sending message failed!"));
      console.log(dat.data, "success");
    })
    .catch((er) => console.log("err", er));
};
