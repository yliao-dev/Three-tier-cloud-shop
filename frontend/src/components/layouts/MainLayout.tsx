import { Outlet } from "react-router-dom";
import ScrollToTop from "../ScrollToTop";
import TopBar from "../TopBar";

const MainLayout = () => {
  return (
    <>
      <ScrollToTop />
      <TopBar />
      <Outlet />
    </>
  );
};

export default MainLayout;
