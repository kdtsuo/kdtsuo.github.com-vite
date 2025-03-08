import { Link, useLocation } from "react-router-dom";
import kdtlogotransparent from "../assets/img/kdtlogotransparent.png";

import { supabase } from "@/lib/supabase";
import { Loader2, LogIn, LogOut, Menu, MoonIcon, SunIcon } from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import instagramlogo from "../assets/img/icons/instagramlogo.png";
import maillogo from "../assets/img/icons/maillogo.png";
import discordlogo from "../assets/img/icons/discordlogo.png";
import githublogo from "../assets/img/icons/githublogo.png";
import IconLink from "./subcomponents/IconLink";
import { useAuth } from "@/contexts/AuthContext";
import { toast, Toaster } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

// Theme Toggle Button component
function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="button"
      className="p-2 outline rounded-xl flex"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </div>
  );
}

// Login Dialog Component
function LoginDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message, {
          duration: 3000,
        });
      } else {
        // Login successful
        setIsOpen(false);
        toast.success("Logged in successfully " + data.session.user.email, {
          duration: 3000,
        });
      }
    } catch (err) {
      toast.error("An unexpected error occurred", {
        duration: 3000,
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          Login
          <LogIn />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Login</DialogTitle>
          <DialogDescription>
            Sign in to your account to edit the website contents. One will be
            provided to you if you are a team member. Contact the developer for
            more info.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSignIn}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="cursor-pointer" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LogoutDialog() {
  const { user, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      toast.success("Logged out successfully", {
        duration: 3000,
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to log out. Please try again.", {
        duration: 3000,
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={isLoggingOut}>
          {isLoggingOut ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Logging out...
            </>
          ) : (
            <>
              {user?.email?.split("@")[0]}
              <LogOut />
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[300px]">
        <DialogHeader>
          <DialogTitle>Logout</DialogTitle>
          <DialogDescription>
            Are you sure you want to log out?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleSignOut}>
            Logout <LogOut />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Navbar() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const items = ["Home", "About", "Positions", "Contacts", "Sponsors"];
  const [open, setOpen] = useState(false);

  const authSection = user ? (
    <>
      <LogoutDialog />
    </>
  ) : (
    <>
      <LoginDialog />
    </>
  );

  const linkIcons = [
    {
      href: "https://www.instagram.com/kdt.suo/?theme=dark",
      imgSrc: instagramlogo,
      alt: "instagram",
    },
    {
      href: "mailto:kpopdanceteam.suo@gmail.com",
      imgSrc: maillogo,
      alt: "mail",
    },
    {
      href: "https://discord.com/invite/tbKkvjV2W8",
      imgSrc: discordlogo,
      alt: "discord",
    },
    {
      href: "https://www.github.com/kdtsuo/v3",
      imgSrc: githublogo,
      alt: "github",
    },
  ];

  return (
    <div>
      <div className="fixed left-1/2 top-0 z-50 mt-4 md:mt-7 w-11/12 max-w-7xl -translate-x-1/2">
        <div className="w-full rounded-full border bg-background/80 backdrop-blur-md shadow-sm">
          <div className=" w-full flex justify-between items-center py-4 px-2 lg:px-4">
            {/* Logo */}
            <Link to="/">
              <img
                src={kdtlogotransparent}
                alt="KDT Logo"
                className="w-16 h-auto"
              />
            </Link>

            <div>
              {/* Navigation Links - Desktop */}
              <div className="hidden lg:flex items-center gap-2">
                <div className="flex items-center gap-2 lg:gap-4">
                  <ThemeToggle />
                  {items.map((item) => {
                    const path = item.toLowerCase();
                    const itemPath = path === "home" ? "" : path;
                    const isActive =
                      pathname === `/${itemPath}` ||
                      (pathname === "/" && item === "Home");

                    return (
                      <Button
                        key={item}
                        asChild
                        variant={isActive ? "default" : "outline"}
                        className="text-base font-medium"
                      >
                        <Link to={`/${itemPath}`}>{item}</Link>
                      </Button>
                    );
                  })}
                </div>
                <div className="mx-4 flex items-center">{authSection}</div>
              </div>

              {/* Mobile Menu Button */}
              <div className="lg:hidden h-auto flex items-center gap-4">
                <ThemeToggle />
                <Sheet open={open} onOpenChange={setOpen}>
                  <SheetTrigger asChild>
                    <div role="button" className="p-2 outline rounded-xl">
                      <Menu size={30} />
                    </div>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <SheetHeader className="flex items-center mb-6">
                      <SheetTitle>
                        <img
                          src={kdtlogotransparent}
                          alt="KDT Logo"
                          className="w-28 h-auto mx-auto"
                        />
                      </SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col items-center justify-center space-y-6 text-xl w-1/2 mx-auto">
                      {items.map((item) => {
                        const path = item.toLowerCase();
                        const itemPath = path === "home" ? "" : path;
                        const isActive =
                          pathname === `/${itemPath}` ||
                          (pathname === "/" && item === "Home");

                        return (
                          <Button
                            key={item}
                            asChild
                            variant={isActive ? "default" : "ghost"}
                            onClick={() => setOpen(false)}
                            className="w-full justify-center text-lg"
                          >
                            <Link to={`/${itemPath}`}>{item}</Link>
                          </Button>
                        );
                      })}
                      <div className="pt-4 flex flex-col items-center gap-4">
                        {authSection}
                        <ThemeToggle />
                      </div>
                    </div>
                    <SheetFooter className="w-full flex justify-center mt-4">
                      <IconLink links={linkIcons} />
                    </SheetFooter>
                  </SheetContent>
                </Sheet>

                <div className="mr-1"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
