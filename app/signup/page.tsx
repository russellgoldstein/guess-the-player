import SignupForm from '@/src/components/SignUpForm';
import Link from 'next/link';

export const metadata = {
    title: 'Sign Up - Stat Attack',
    description: 'Create an account to start creating and playing baseball guessing games',
};

export default function SignupPage() {
    return (
        <div className="container max-w-4xl mx-auto py-12 px-4">
            <div className="flex flex-col items-center mb-8">
                <div className="w-64 h-64 mb-0">
                    <img
                        src="/images/logo.svg"
                        alt="Stat Attack Logo"
                        width={144}
                        height={144}
                        className="w-full h-full"
                    />
                </div>
                <Link href="/" className="text-2xl font-bold text-mlb-blue -mt-4">
                    Stat Attack
                </Link>
            </div>

            <h1 className="text-3xl font-bold text-center mb-8 text-mlb-blue">Create an Account</h1>
            <SignupForm />
        </div>
    );
} 