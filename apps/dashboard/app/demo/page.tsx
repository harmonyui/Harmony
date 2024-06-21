import React from "react";
import { withAuth } from "../../utils/protected-routes-hoc";
import { SnappingDemo } from "../../utils/flex-demo";

const DemoPage = withAuth(() => {
  return <SnappingDemo />;
});

export default DemoPage;
