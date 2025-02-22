import { useState } from 'react';
import { Button, Input, Form, FormField, FormLabel } from 'shadcn-ui';

const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle login logic here
    };

    return (
        <Form onSubmit={handleSubmit}>
            <FormField>
                <FormLabel>Email</FormLabel>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </FormField>
            <FormField>
                <FormLabel>Password</FormLabel>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </FormField>
            <Button type="submit">Log In</Button>
        </Form>
    );
};

export default LoginForm; 