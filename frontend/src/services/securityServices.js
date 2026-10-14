import * as crud from "./crudServices";

const RESOURCE = "security";

const securityServices = {
  changePassword: (data) =>
    crud.update(`${RESOURCE}/change-password`, "", data),
};

export default securityServices;
