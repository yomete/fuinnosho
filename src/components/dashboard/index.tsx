import { getUserProfile } from "@/lib/auth";

const Dashboard = async () => {
  const user = await getUserProfile();
  console.log(user);
  return (
    <div>
      <h1>Dashboard</h1>
    </div>
  );
};

export default Dashboard;
