import {  withAuth } from "../utils/protected-routes-hoc";
import { redirect } from "next/navigation";

const Home = withAuth(() => {
	redirect('/projects');
})

export default Home;