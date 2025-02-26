import SignupForm from '@/src/components/SignUpForm';

export const metadata = {
    title: 'Sign Up - Stat Attack',
    description: 'Create an account to start creating and playing baseball guessing games',
};

export default function SignupPage() {
    return (
        <div className="container max-w-4xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold text-center mb-8 text-mlb-blue">Create an Account</h1>
            <SignupForm />
        </div>
    );
} 