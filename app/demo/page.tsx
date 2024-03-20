import { NextPage } from "next";
import { SideNav } from "../../utils/side-nav";
import {  ModalProvider } from "@harmony/ui/src/components/core/modal";
import React, { useRef } from "react";
import { withAuth } from "../../utils/protected-routes-hoc";
import { ElementDemo, FlexBoxDemo, SnappingDemo } from "../../utils/flex-demo";



const DemoPage = withAuth(async ({ctx}) => {
	return (
		<SnappingDemo/>
	)
});

export default DemoPage;