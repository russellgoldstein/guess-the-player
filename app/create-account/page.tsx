// app/create-account/page.tsx
'use client';

import React, { useState } from 'react';
import { supabase } from '../../src/lib/supabaseClient';

const CreateAccountPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });

        if (signUpError) {
            console.error('Error creating account:', signUpError.message);
        } else {
            const userId = signUpData.user?.id;
            if (userId) {
                // Insert the new user into the users table
                const { error: insertError } = await supabase.from('users').insert([{ id: userId, email, username: email }]);
                if (insertError) {
                    console.error('Error inserting user into users table:', insertError.message);
                } else {
                    // Redirect to the login page or another page after successful account creation
                }
            }
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