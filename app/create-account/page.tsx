// app/create-account/page.tsx
'use client';

import React, { useState } from 'react';
import { supabase } from '../../src/lib/supabaseClient';

const CreateAccountPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
            console.error('Error creating account:', error.message);
        } else {
            // Redirect to the login page or another page after successful account creation
        }
    };

    return (
        <div>
            <h1>Create Account</h1>
            <form onSubmit={handleCreateAccount}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Create Account</button>
            </form>
        </div>
    );
};

export default CreateAccountPage;