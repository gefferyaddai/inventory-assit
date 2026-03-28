import {useNavigate} from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
    const { login } = useAuth();
    const  navigate = useNavigate();

    const handleAdminLogin = () => {
        login({
            name: "Kevin",
            email: "kevin@admin.com",
            role: "admin",
        });
        navigate("/admin/dashboard");
    };

    const handleClerkLogin = () => {
         login({
            name: "Cj Obi",
            email: "Cj@admin.com",
            role: "clerk",
        });
        navigate("/clerk/dashboard");
    };

}