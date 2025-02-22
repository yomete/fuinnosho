import { getUser } from "@/app/actions/user";
import NavUserIcon from "./nav-user-icon";

const NavUserIconWrapper = async () => {
  const { user } = await getUser();
  console.log("🚀 ~ NavUserIconWrapper ~ user:", user);

  return <NavUserIcon user={user} />;
};

export default NavUserIconWrapper;
