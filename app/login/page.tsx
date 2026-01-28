import { LoginForm } from "@/components/login/loginFormSection";
import { LoginLoading } from "@/components/sekeletons/loginSekeleton";
import { Suspense } from "react";



export default function LoginPage() {
    return (
        <Suspense fallback={<LoginLoading />}>
            <LoginForm />
        </Suspense>
    );
}
