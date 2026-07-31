import React, { memo } from "react";
import PoliciesView from "./policies/PoliciesView";
import usePoliciesController from "./policies/usePoliciesController";

function Policies() {
  const controller = usePoliciesController();

  return <PoliciesView controller={controller} />;
}

export default memo(Policies);
