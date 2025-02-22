import { NavigationMenu, NavigationMenuItem, NavigationMenuLink } from '@radix-ui/react-navigation-menu';
import Link from 'next/link';

const NavMenu = () => {
    return (
        <NavigationMenu>
            <NavigationMenuItem>
                <NavigationMenuLink asChild>
                    <Link href="/">Home</Link>
                </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
                <NavigationMenuLink asChild>
                    <Link href="/create-game">Create Game</Link>
                </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
                <NavigationMenuLink asChild>
                    <Link href="/profile">Profile</Link>
                </NavigationMenuLink>
            </NavigationMenuItem>
        </NavigationMenu>
    );
};

export default NavMenu; 