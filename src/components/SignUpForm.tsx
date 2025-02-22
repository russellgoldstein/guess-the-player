import { useState } from 'react';
import { Button, Input, Form, FormField, FormLabel } from 'shadcn-ui';

const SignUpForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle sign-up logic here
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
      <Button type="submit">Sign Up</Button>
    </Form>
  );
};

export default SignUpForm; 